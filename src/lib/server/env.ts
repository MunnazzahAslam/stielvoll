/** Server-side configuration. Every service is optional so the shop also runs as a local demo. */

const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";

export const env = {
  /** Test keys only: this is a portfolio piece and must never take real money. */
  stripeSecretKey: /^(sk|rk)_test_/.test(stripeKey) ? stripeKey : null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  supabaseUrl: process.env.SUPABASE_URL || null,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
  adminPassword: process.env.ADMIN_PASSWORD || null,
};

if (stripeKey && !env.stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is not a test key and has been ignored. Stielvoll runs in Stripe test mode only.");
}

/** Where the site lives, for links in emails, Stripe redirects and metadata. */
export function siteUrl(request?: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
