import { SLOTS } from "@/data/shop";
import { slotDays } from "@/lib/slots";
import { slotLoad } from "@/lib/server/orders";

/** The slots a visitor can book right now, and which of them are already full. */
export async function GET() {
  const days = slotDays();
  const load = await slotLoad(days.flatMap((d) => d.slots));
  return Response.json(
    { days: days.map((d) => ({ date: d.date, slots: d.slots.map((start) => ({ start, full: load[start] >= SLOTS.capacity })) })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
