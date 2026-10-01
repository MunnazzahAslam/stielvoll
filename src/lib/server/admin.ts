import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * /admin sign-in: one shared password from ADMIN_PASSWORD. The cookie holds an HMAC derived
 * from it, so it can't be forged and changing the password signs everyone out.
 */

export const ADMIN_COOKIE = "stielvoll-admin";

const token = (password: string) => createHmac("sha256", password).update("stielvoll-admin-v1").digest("hex");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const passwordMatches = (attempt: string) => !!env.adminPassword && same(token(attempt), token(env.adminPassword));

export const sessionToken = () => (env.adminPassword ? token(env.adminPassword) : null);

export async function isAdmin() {
  const expected = sessionToken();
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!expected && !!cookie && same(cookie, expected);
}
