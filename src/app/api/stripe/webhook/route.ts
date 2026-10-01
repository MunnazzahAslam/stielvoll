import type Stripe from "stripe";
import { env } from "@/lib/server/env";
import { deleteUnpaidOrder, findBySession, markPaidBySession } from "@/lib/server/orders";
import { stripe } from "@/lib/server/stripe";

/** Stripe tells us when a Checkout session is paid (or expires unpaid, which frees its slot). */
export async function POST(request: Request) {
  const client = stripe();
  const signature = request.headers.get("stripe-signature");
  if (!client || !env.stripeWebhookSecret || !signature) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(await request.text(), signature, env.stripeWebhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (event.data.object.payment_status === "paid") await markPaidBySession(event.data.object.id);
      break;
    case "checkout.session.expired": {
      const order = await findBySession(event.data.object.id);
      if (order && !order.paid) await deleteUnpaidOrder(order.id);
      break;
    }
  }
  return Response.json({ received: true });
}
