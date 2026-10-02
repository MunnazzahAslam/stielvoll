import { deliveryDistrict, deliveryFeeCents, flavourById, SLOTS } from "@/data/shop";
import { routing, type Locale } from "@/i18n/routing";
import { clean } from "@/lib/cart";
import { itemsSubtotalCents, orderItems, type Fulfilment } from "@/lib/order";
import { isBookable } from "@/lib/slots";
import { siteUrl } from "@/lib/server/env";
import { createOrder, deleteUnpaidOrder, isSlotFull, slotLoad, updateOrder } from "@/lib/server/orders";
import { allowOrder, clientKey } from "@/lib/server/rateLimit";
import { stripe } from "@/lib/server/stripe";

/** Error codes the checkout form knows how to explain (messages: checkout.errors.*). */
type ErrorCode = "cart_empty" | "invalid_details" | "postcode_outside" | "slot_unavailable" | "slot_full" | "payment_unavailable" | "rate_limited";

const fail = (error: ErrorCode, status = 400, fields?: string[]) => Response.json({ error, fields }, { status });

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const BOX_LABEL: Record<Locale, (n: number) => string> = { de: (n) => `${n}er-Box`, en: (n) => `Box of ${n}` };

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_details");
  }
  const locale: Locale = routing.locales.includes(body.locale as Locale) ? (body.locale as Locale) : routing.defaultLocale;
  const d = (body.details ?? {}) as Record<string, unknown>;

  // The browser only says what's in the cart; prices come from the shop data.
  const items = orderItems(clean(body.cart));
  if (!items.length) return fail("cart_empty");

  const fulfilment: Fulfilment = d.fulfilment === "delivery" ? "delivery" : "pickup";
  const name = text(d.name, 80);
  const email = text(d.email, 120);
  const phone = text(d.phone, 30);
  const address = fulfilment === "delivery" ? text(d.address, 160) : "";
  const postcode = fulfilment === "delivery" ? text(d.postcode, 5) : "";
  const slot = text(d.slot, 40);

  const invalid = [
    name.length < 2 && "name",
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && "email",
    (phone.replace(/\D/g, "").length < 6 || !/^[+\d\s()/-]+$/.test(phone)) && "phone",
    fulfilment === "delivery" && address.length < 4 && "address",
    fulfilment === "delivery" && !/^\d{5}$/.test(postcode) && "postcode",
  ].filter((f): f is string => !!f);
  if (invalid.length) return fail("invalid_details", 400, invalid);

  if (fulfilment === "delivery" && !deliveryDistrict(postcode)) return fail("postcode_outside", 400, ["postcode"]);
  if (!isBookable(slot)) return fail("slot_unavailable", 409, ["slot"]);
  if (await isSlotFull(slot)) return fail("slot_full", 409, ["slot"]);
  // Counted only for orders that would otherwise go through, so typos in the form cost nothing.
  if (!allowOrder(clientKey(request))) return fail("rate_limited", 429);

  const subtotal = itemsSubtotalCents(items);
  const delivery = fulfilment === "delivery" ? deliveryFeeCents(subtotal) : 0;

  const order = await createOrder({
    fulfilment,
    slot_start: new Date(slot).toISOString(),
    name,
    email,
    phone,
    address: address || null,
    postcode: postcode || null,
    items,
    subtotal_cents: subtotal,
    delivery_cents: delivery,
    total_cents: subtotal + delivery,
  });

  // Two orders can pass the check above at the same moment. Counting again with this order in place
  // catches that: whoever pushes the slot over capacity steps back (at worst both do, never too many).
  if ((await slotLoad([order.slot_start]))[order.slot_start] > SLOTS.capacity) {
    await deleteUnpaidOrder(order.id);
    return fail("slot_full", 409, ["slot"]);
  }

  const base = `${siteUrl(request)}${locale === routing.defaultLocale ? "" : `/${locale}`}`;
  const confirmation = (session: string) => `${base}/order/${order.number}?s=${session}`;

  const client = stripe();
  if (!client) {
    // Demo mode: no Stripe key, so the order counts as paid straight away.
    const session = `demo_${crypto.randomUUID().replace(/-/g, "")}`;
    await updateOrder(order.id, { stripe_session_id: session, paid: true });
    return Response.json({ url: confirmation(session) });
  }

  try {
    const name = (id: Parameters<typeof flavourById>[0]) => flavourById(id).name[locale];
    const session = await client.checkout.sessions.create({
      mode: "payment",
      locale,
      customer_email: email,
      client_reference_id: order.number,
      metadata: { order_id: order.id, order_number: order.number },
      line_items: [
        ...items.map((item) =>
          item.kind === "single"
            ? { quantity: item.quantity, price_data: { currency: "eur", unit_amount: item.unit_cents, product_data: { name: name(item.flavour) } } }
            : {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: item.price_cents,
                  product_data: { name: BOX_LABEL[locale](item.size), description: item.mix.map((m) => `${m.quantity} × ${name(m.flavour)}`).join(", ") },
                },
              },
        ),
        ...(delivery
          ? [{ quantity: 1, price_data: { currency: "eur", unit_amount: delivery, product_data: { name: locale === "de" ? "Lieferung" : "Delivery" } } }]
          : []),
      ],
      // Stripe fills in the session id; the confirmation page needs it to show the order.
      success_url: confirmation("{CHECKOUT_SESSION_ID}"),
      cancel_url: `${base}/checkout?cancelled=${order.number}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    await updateOrder(order.id, { stripe_session_id: session.id });
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout failed", error);
    await deleteUnpaidOrder(order.id);
    return fail("payment_unavailable", 502);
  }
}
