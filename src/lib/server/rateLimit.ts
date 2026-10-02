/**
 * Orders per visitor: a few within ten minutes, so a script can't hold every slot with unpaid orders.
 * Kept in this server's memory, so on Vercel each instance counts on its own. Enough for a small shop.
 */

const WINDOW_MS = 10 * 60_000;
const MAX_ORDERS = 5;

const store = globalThis as unknown as { stielvollHits?: Map<string, number[]> };
store.stielvollHits ??= new Map();
const hits = store.stielvollHits;

/** The visitor's IP address as the hosting platform reports it. */
export function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

/** Counts one order attempt; false once the visitor has used up the window. */
export function allowOrder(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ORDERS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return true;
}
