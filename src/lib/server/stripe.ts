import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

/** The Stripe client, or null when no test key is configured (demo mode: orders skip payment). */
export function stripe() {
  if (!env.stripeSecretKey) return null;
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}
