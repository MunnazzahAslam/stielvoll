import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import AutoRefresh from "@/components/AutoRefresh";
import ClearCart from "@/components/ClearCart";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PopsicleStill from "@/components/PopsicleStill";
import { flavourById } from "@/data/shop";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { describeItem, type Order } from "@/lib/order";
import { slotEnd } from "@/lib/slots";
import { findForCustomer, markPaidBySession } from "@/lib/server/orders";
import { stripe } from "@/lib/server/stripe";

export async function generateMetadata({ params }: PageProps<"/[locale]/order/[number]">): Promise<Metadata> {
  const { locale, number } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("order", { number }), robots: { index: false } };
}

/** If the webhook hasn't arrived yet, ask Stripe directly so the visitor isn't left waiting. */
async function confirmWithStripe(order: Order) {
  const client = stripe();
  if (order.paid || !client || !order.stripe_session_id?.startsWith("cs_")) return order;
  try {
    const session = await client.checkout.sessions.retrieve(order.stripe_session_id);
    if (session.payment_status === "paid") return (await markPaidBySession(session.id)) ?? order;
  } catch (error) {
    console.error("Could not check the Stripe session", error);
  }
  return order;
}

export default async function OrderPage({ params, searchParams }: PageProps<"/[locale]/order/[number]">) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  const { s } = await searchParams;
  const found = await findForCustomer(number, typeof s === "string" ? s : "");
  if (!found) notFound();
  const order = await confirmWithStripe(found);

  const t = await getTranslations("order");
  const tc = await getTranslations("cart");
  const format = await getFormatter();
  const money = (cents: number) => format.number(cents / 100, { style: "currency", currency: "EUR" });
  const time = (d: string | Date) => format.dateTime(new Date(d), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const slot = t("slot", {
    day: format.dateTime(new Date(order.slot_start), { weekday: "long", day: "numeric", month: "long" }),
    from: time(order.slot_start),
    to: time(slotEnd(order.slot_start)),
  });
  const firstFlavour = order.items[0].kind === "single" ? order.items[0].flavour : order.items[0].mix[0].flavour;
  const demo = order.stripe_session_id?.startsWith("demo_");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-5 pt-8 pb-20 md:pt-14">
        {!order.paid ? (
          <section className="rounded-[28px] bg-white p-8 text-center" aria-live="polite">
            <AutoRefresh seconds={3} />
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em]">{t("pendingTitle")}</h1>
            <p className="mt-3 text-currant/75">{t("pendingText")}</p>
          </section>
        ) : (
          <>
            <ClearCart />
            <div className="flex items-start gap-5">
              <PopsicleStill color={flavourById(firstFlavour).color} className="h-28 w-auto shrink-0 -rotate-12 md:h-36" />
              <div>
                <h1 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] leading-none font-extrabold tracking-[-0.03em]">{t("thanks", { name: order.name.split(" ")[0] })}</h1>
                <p className="mt-3 text-sm font-bold tracking-wide text-currant/70 uppercase">{t("number")}</p>
                <p className="font-display text-4xl font-extrabold tabular-nums">{order.number}</p>
              </div>
            </div>

            <section className="mt-8 rounded-[28px] bg-white p-6">
              <p className="text-sm font-bold tracking-wide text-currant/70 uppercase">{order.fulfilment === "pickup" ? t("pickupAt") : t("deliveryAt")}</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{slot}</p>
              <p className="mt-1 text-currant/80">{order.fulfilment === "pickup" ? t("shop") : `${order.address}, ${order.postcode} Hamburg`}</p>

              <h2 className="mt-6 text-sm font-bold tracking-wide text-currant/70 uppercase">{t("items")}</h2>
              <ul className="mt-2 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i}>{describeItem(item, locale as Locale, (size) => tc("boxOf", { size }))}</li>
                ))}
              </ul>
              <p className="mt-4 flex items-baseline justify-between border-t border-currant/10 pt-4 font-bold">
                <span>{demo ? t("totalDemo") : t("total")}</span>
                <span className="font-display text-2xl font-extrabold tabular-nums">{money(order.total_cents)}</span>
              </p>
            </section>

            <section className="mt-5 rounded-[28px] bg-currant p-6 text-frost">
              <h2 className="font-display text-2xl font-extrabold">❄ {t("frozenTitle")}</h2>
              <p className="mt-2 text-frost/85">{t("frozenTip")}</p>
              <p className="mt-2 text-frost/85">{order.fulfilment === "delivery" ? t("deliveryTip") : t("pickupTip")}</p>
            </section>

            <p className="mt-5 text-sm text-currant/70">{t("change")}</p>
            <p className="mt-2 text-sm font-semibold text-currant/70">{t("concept")}</p>
          </>
        )}

        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-currant px-6 font-bold text-frost">
          {t("back")}
        </Link>
      </main>
      <Footer />
    </>
  );
}
