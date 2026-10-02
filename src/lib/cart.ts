import { BOX_PRICE_CENTS, FLAVOURS, flavourById, type BoxSize, type FlavourId } from "@/data/shop";

/** How many of each flavour. */
export type Mix = Partial<Record<FlavourId, number>>;
export type BoxLine = { id: string; size: BoxSize; mix: Mix };
export type Cart = { singles: Mix; boxes: BoxLine[] };

const KEY = "stielvoll-cart-v1";
const EMPTY: Cart = { singles: {}, boxes: [] };
const MAX_PER_FLAVOUR = 24;

let cart: Cart = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

/** Keep only what the shop still sells, in case stored data is old or was edited. The server uses it on checkout too. */
export function clean(raw: unknown): Cart {
  const ids = new Set<string>(FLAVOURS.map((f) => f.id));
  const mix = (m: unknown): Mix =>
    Object.fromEntries(
      Object.entries((m ?? {}) as Record<string, unknown>)
        .filter(([id, n]) => ids.has(id) && Number.isInteger(n) && (n as number) > 0)
        .map(([id, n]) => [id, Math.min(n as number, MAX_PER_FLAVOUR)]),
    );
  const data = (raw ?? {}) as { singles?: unknown; boxes?: unknown };
  const boxes = (Array.isArray(data.boxes) ? data.boxes : [])
    .map((b) => ({ id: String(b?.id), size: b?.size as BoxSize, mix: mix(b?.mix) }))
    .filter((b) => b.size in BOX_PRICE_CENTS && mixCount(b.mix) === b.size);
  return { singles: mix(data.singles), boxes };
}

function load() {
  loaded = true;
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) cart = clean(JSON.parse(stored));
  } catch {
    // Private mode or bad data: start with an empty cart.
  }
}

function set(next: Cart) {
  cart = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {}
  listeners.forEach((l) => l());
}

/* ---------- store (for useSyncExternalStore) ---------- */

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
export const getCart = () => {
  if (!loaded) load();
  return cart;
};
/** The server never knows the cart; it renders an empty one. */
export const getServerCart = () => EMPTY;

/* ---------- actions ---------- */

export function setSingle(id: FlavourId, quantity: number) {
  const singles = { ...getCart().singles };
  const n = Math.max(0, Math.min(MAX_PER_FLAVOUR, Math.round(quantity)));
  if (n === 0) delete singles[id];
  else singles[id] = n;
  set({ ...cart, singles });
}

export const addSingle = (id: FlavourId) => setSingle(id, (getCart().singles[id] ?? 0) + 1);

export function addBox(size: BoxSize, mix: Mix) {
  if (mixCount(mix) !== size) return;
  const id = `box-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  set({ ...getCart(), boxes: [...cart.boxes, { id, size, mix: { ...mix } }] });
}

export const removeBox = (id: string) => set({ ...getCart(), boxes: cart.boxes.filter((b) => b.id !== id) });

export const clearCart = () => set(EMPTY);

/* ---------- sums ---------- */

export const mixCount = (mix: Mix) => Object.values(mix).reduce((sum, n) => sum + (n ?? 0), 0);

/** What a mix would cost bought one by one. */
export const mixSinglesCents = (mix: Mix) =>
  Object.entries(mix).reduce((sum, [id, n]) => sum + flavourById(id as FlavourId).priceCents * (n ?? 0), 0);

export const cartCount = (c: Cart) => mixCount(c.singles) + c.boxes.reduce((sum, b) => sum + b.size, 0);

export const cartSubtotalCents = (c: Cart) =>
  mixSinglesCents(c.singles) + c.boxes.reduce((sum, b) => sum + BOX_PRICE_CENTS[b.size], 0);

/** The flavours in a mix, in menu order, with their counts. */
export const mixEntries = (mix: Mix) =>
  FLAVOURS.filter((f) => (mix[f.id] ?? 0) > 0).map((f) => ({ flavour: f, quantity: mix[f.id]! }));

/* ---------- "a popsicle drops into the cart" ---------- */

export type Flight = { id: number; from: { x: number; y: number }; color: string };
const flightListeners = new Set<(f: Flight) => void>();
let flightId = 0;

export const onFlight = (listener: (f: Flight) => void) => {
  flightListeners.add(listener);
  return () => void flightListeners.delete(listener);
};

/** Send a mini popsicle from an element (the button just pressed) to the cart icon. */
export function flyToCart(from: Element, color: string) {
  const r = from.getBoundingClientRect();
  const flight = { id: ++flightId, from: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, color };
  flightListeners.forEach((l) => l(flight));
}
