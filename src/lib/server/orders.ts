import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SLOTS } from "@/data/shop";
import type { Order, OrderStatus } from "@/lib/order";
import { env } from "./env";

/**
 * Order storage. Supabase (Postgres) when it is configured; otherwise an in-memory list,
 * which is enough to try the shop locally but forgets everything on restart.
 */

export type NewOrder = Omit<Order, "id" | "number" | "status" | "paid" | "created_at" | "stripe_session_id">;

/** An unpaid order holds its slot this long: as long as a Stripe Checkout session stays open. */
const HOLD_MINUTES = 31;

const iso = (t: string) => new Date(t).toISOString();
const normalise = (o: Order): Order => ({ ...o, slot_start: iso(o.slot_start), created_at: iso(o.created_at) });

/* ---------- Supabase ---------- */

let supabase: SupabaseClient | null = null;
const db = () => {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null;
  supabase ??= createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
  return supabase;
};

function check<T>({ data, error }: { data: T; error: { message: string } | null }) {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

/* ---------- in memory (local demo) ---------- */

const memory = globalThis as unknown as { stielvollOrders?: Order[]; stielvollNumber?: number };
memory.stielvollOrders ??= [];
memory.stielvollNumber ??= 1041;
const mem = memory.stielvollOrders;

/* ---------- the store ---------- */

export const usingDatabase = () => db() !== null;

export async function createOrder(input: NewOrder): Promise<Order> {
  const client = db();
  if (client) return normalise(check(await client.from("orders").insert(input).select().single<Order>())!);

  const order: Order = {
    ...input,
    id: crypto.randomUUID(),
    number: `ST-${++memory.stielvollNumber!}`,
    status: "new",
    paid: false,
    stripe_session_id: null,
    created_at: new Date().toISOString(),
  };
  mem.push(order);
  return order;
}

export async function updateOrder(id: string, patch: Partial<Pick<Order, "stripe_session_id" | "paid" | "status">>) {
  const client = db();
  if (client) return void check(await client.from("orders").update(patch).eq("id", id));
  const order = mem.find((o) => o.id === id);
  if (order) Object.assign(order, patch);
}

export async function deleteUnpaidOrder(id: string) {
  const client = db();
  if (client) return void check(await client.from("orders").delete().eq("id", id).eq("paid", false));
  const i = mem.findIndex((o) => o.id === id && !o.paid);
  if (i >= 0) mem.splice(i, 1);
}

/** Marks the order for a Stripe Checkout session as paid. Returns the order, or null if there is none. */
export async function markPaidBySession(sessionId: string) {
  const client = db();
  if (client) {
    const rows = check(await client.from("orders").update({ paid: true }).eq("stripe_session_id", sessionId).select());
    return rows?.[0] ? normalise(rows[0] as Order) : null;
  }
  const order = mem.find((o) => o.stripe_session_id === sessionId);
  if (order) order.paid = true;
  return order ?? null;
}

export async function findBySession(sessionId: string) {
  const client = db();
  if (client) {
    const row = check(await client.from("orders").select().eq("stripe_session_id", sessionId).maybeSingle<Order>());
    return row ? normalise(row) : null;
  }
  return mem.find((o) => o.stripe_session_id === sessionId) ?? null;
}

/** An order by its number, but only for whoever holds its session id (the link in the confirmation). */
export async function findForCustomer(number: string, sessionId: string) {
  if (!sessionId) return null;
  const order = await findBySession(sessionId);
  return order?.number === number ? order : null;
}

/** How many orders each slot already holds: paid ones, and unpaid ones still at checkout. */
export async function slotLoad(slots: string[]): Promise<Record<string, number>> {
  const since = Date.now() - HOLD_MINUTES * 60_000;
  const load: Record<string, number> = Object.fromEntries(slots.map((s) => [s, 0]));
  if (!slots.length) return load;

  let rows: Pick<Order, "slot_start" | "paid" | "created_at">[];
  const client = db();
  if (client) {
    rows = check(
      await client
        .from("orders")
        .select("slot_start, paid, created_at")
        .in("slot_start", slots)
        .or(`paid.eq.true,created_at.gt.${new Date(since).toISOString()}`),
    ) as typeof rows;
  } else {
    rows = mem;
  }
  for (const row of rows) {
    const slot = iso(row.slot_start);
    if (slot in load && (row.paid || new Date(row.created_at).getTime() > since)) load[slot]++;
  }
  return load;
}

export const isSlotFull = async (slot: string) => (await slotLoad([slot]))[slot] >= SLOTS.capacity;

/** Paid orders with a slot from `from` on, earliest slot first. */
export async function paidOrdersFrom(from: Date): Promise<Order[]> {
  const client = db();
  if (client) {
    const rows = check(
      await client.from("orders").select().eq("paid", true).gte("slot_start", from.toISOString()).order("slot_start").order("created_at").limit(300),
    );
    return (rows as Order[]).map(normalise);
  }
  return mem
    .filter((o) => o.paid && new Date(o.slot_start) >= from)
    .sort((a, b) => a.slot_start.localeCompare(b.slot_start) || a.created_at.localeCompare(b.created_at));
}

export async function setStatus(id: string, status: OrderStatus) {
  await updateOrder(id, { status });
}
