import AutoRefresh from "@/components/AutoRefresh";
import Logo from "@/components/Logo";
import { describeItem, itemsCount, type Order } from "@/lib/order";
import { shopToday, slotEnd } from "@/lib/slots";
import { isAdmin } from "@/lib/server/admin";
import { paidOrdersFrom, usingDatabase } from "@/lib/server/orders";
import { signOut } from "./actions";
import SignIn from "./SignIn";
import StatusButtons from "./StatusButtons";

const TZ = "Europe/Berlin";
const time = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const dayName = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const STATUS_LABEL: Record<Order["status"], string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  done: "Done",
};

export default async function AdminPage() {
  if (!(await isAdmin())) return <SignIn />;

  const { start: today } = shopToday();
  const orders = await paidOrdersFrom(today);
  const todayKey = dayKey.format(today);
  const tomorrowKey = dayKey.format(new Date(today.getTime() + 36 * 3_600_000));

  // Today's and the coming days' orders, one list per day, earliest slot first.
  const days = new Map<string, Order[]>();
  for (const order of orders) {
    const key = dayKey.format(new Date(order.slot_start));
    days.set(key, [...(days.get(key) ?? []), order]);
  }
  const label = (key: string, sample: Order) =>
    `${key === todayKey ? "Today, " : key === tomorrowKey ? "Tomorrow, " : ""}${dayName.format(new Date(sample.slot_start))}`;

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-8 md:px-8">
      <AutoRefresh seconds={15} />
      <header className="flex flex-wrap items-center gap-4">
        <Logo className="text-[28px]" />
        <h1 className="font-display text-2xl font-extrabold">Orders</h1>
        <p className="text-sm text-currant/60">Refreshes every 15 seconds.</p>
        <form action={signOut} className="ml-auto">
          <button type="submit" className="h-10 rounded-full border-2 border-currant/20 px-4 text-sm font-bold">
            Sign out
          </button>
        </form>
      </header>
      {!usingDatabase() && (
        <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold">
          Demo storage: Supabase isn’t configured, so orders live in this server’s memory and disappear on restart.
        </p>
      )}

      {orders.length === 0 && <p className="mt-16 text-center text-lg text-currant/70">No paid orders for today or the coming days yet.</p>}

      {[...days].map(([key, list]) => (
        <section key={key} className="mt-10">
          <h2 className="font-display text-xl font-extrabold">
            {label(key, list[0])} <span className="font-sans text-base font-semibold text-currant/60">· {list.length} {list.length === 1 ? "order" : "orders"}</span>
          </h2>
          <ul className="mt-3 space-y-3">
            {list.map((order) => (
              <li key={order.id} className={`grid gap-4 rounded-3xl bg-white p-5 md:grid-cols-[150px_1fr_auto] ${order.status === "done" ? "opacity-55" : ""}`}>
                <div>
                  <p className="font-display text-2xl font-extrabold tabular-nums">
                    {time.format(new Date(order.slot_start))}–{time.format(slotEnd(order.slot_start))}
                  </p>
                  <p className="font-bold tabular-nums">{order.number}</p>
                  <p className="mt-1 inline-block rounded-full bg-currant/8 px-2.5 py-0.5 text-xs font-bold">{STATUS_LABEL[order.status]}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-bold">
                    {order.fulfilment === "pickup" ? "Pickup" : "Delivery"} · {order.name} · <a href={`tel:${order.phone}`} className="underline underline-offset-2">{order.phone}</a>
                  </p>
                  {order.fulfilment === "delivery" && (
                    <p className="text-sm">
                      {order.address}, {order.postcode}
                    </p>
                  )}
                  <ul className="mt-2 text-sm text-currant/80">
                    {order.items.map((item, i) => (
                      <li key={i}>{describeItem(item, "en", (size) => `Box of ${size}`)}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-sm font-semibold">
                    {itemsCount(order.items)} {itemsCount(order.items) === 1 ? "popsicle" : "popsicles"} ·{euro.format(order.total_cents / 100)}
                    {order.delivery_cents ? ` (incl. ${euro.format(order.delivery_cents / 100)} delivery)` : ""}
                  </p>
                </div>
                <StatusButtons id={order.id} status={order.status} fulfilment={order.fulfilment} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
