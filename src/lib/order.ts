import { BOX_PRICE_CENTS, flavourById, type BoxSize, type FlavourId } from "@/data/shop";
import { mixEntries, type Cart } from "./cart";

/** Shared between the server, the confirmation page and /admin. */

export const ORDER_STATUSES = ["new", "preparing", "ready", "out_for_delivery", "done"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Fulfilment = "pickup" | "delivery";

export type OrderItem =
  | { kind: "single"; flavour: FlavourId; quantity: number; unit_cents: number }
  | { kind: "box"; size: BoxSize; price_cents: number; mix: { flavour: FlavourId; quantity: number }[] };

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  fulfilment: Fulfilment;
  slot_start: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  postcode: string | null;
  items: OrderItem[];
  subtotal_cents: number;
  delivery_cents: number;
  total_cents: number;
  stripe_session_id: string | null;
  paid: boolean;
  created_at: string;
};

/** A cart as order lines, priced from the shop data (never from what the browser sent). */
export function orderItems(cart: Cart): OrderItem[] {
  const boxes: OrderItem[] = cart.boxes.map((box) => ({
    kind: "box",
    size: box.size,
    price_cents: BOX_PRICE_CENTS[box.size],
    mix: mixEntries(box.mix).map(({ flavour, quantity }) => ({ flavour: flavour.id, quantity })),
  }));
  const singles: OrderItem[] = mixEntries(cart.singles).map(({ flavour, quantity }) => ({
    kind: "single",
    flavour: flavour.id,
    quantity,
    unit_cents: flavour.priceCents,
  }));
  return [...boxes, ...singles];
}

export const itemsSubtotalCents = (items: OrderItem[]) =>
  items.reduce((sum, item) => sum + (item.kind === "box" ? item.price_cents : item.unit_cents * item.quantity), 0);

export const itemsCount = (items: OrderItem[]) =>
  items.reduce((sum, item) => sum + (item.kind === "box" ? item.size : item.quantity), 0);

/** "2 × Mango Passion" or "Box of 6: 3 × Mango Passion, 3 × Cucumber Mint", in one language. */
export function describeItem(item: OrderItem, locale: "de" | "en", boxLabel: (size: number) => string) {
  const name = (id: FlavourId) => flavourById(id).name[locale];
  if (item.kind === "single") return `${item.quantity} × ${name(item.flavour)}`;
  return `${boxLabel(item.size)}: ${item.mix.map((m) => `${m.quantity} × ${name(m.flavour)}`).join(", ")}`;
}
