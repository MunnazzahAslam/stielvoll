import { SLOTS } from "@/data/shop";

/** Pickup and delivery slots, worked out in shop time (Europe/Berlin) whatever the visitor's or server's clock says. */

export type SlotDay = { date: string; slots: string[] };

const wallClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: SLOTS.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** The shop's wall-clock time at an instant. */
function shopTime(at: Date) {
  const p = Object.fromEntries(wallClock.formatToParts(at).map((part) => [part.type, Number(part.value)]));
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
}

/** The instant at which the shop's clock shows this date and hour. */
function atShopTime(year: number, month: number, day: number, hour: number) {
  const guess = Date.UTC(year, month - 1, day, hour);
  const t = shopTime(new Date(guess));
  const offset = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second) - guess;
  return new Date(guess - offset);
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Today (if anything is left) and the next opening day, so there is always something to book.
 * Each slot is the ISO instant it starts.
 */
export function slotDays(now = new Date()): SlotDay[] {
  const today = shopTime(now);
  const earliest = now.getTime() + SLOTS.leadMinutes * 60_000;
  const days: SlotDay[] = [];

  for (let offset = 0; days.length < 2 && offset < 8; offset++) {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    if (SLOTS.closedWeekdays.includes(date.getUTCDay())) continue;
    const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    const slots = SLOTS.startHours
      .map((hour) => atShopTime(y, m, d, hour))
      .filter((start) => start.getTime() >= earliest)
      .map((start) => start.toISOString());
    if (slots.length) days.push({ date: `${y}-${pad(m)}-${pad(d)}`, slots });
  }
  return days;
}

export const isBookable = (slot: string, now = new Date()) => slotDays(now).some((day) => day.slots.includes(slot));

/** Midnight at the start of today, shop time. */
export function shopToday(now = new Date()) {
  const t = shopTime(now);
  return { start: atShopTime(t.year, t.month, t.day, 0) };
}

/** The end of a slot that starts at `start`. */
export const slotEnd = (start: string | Date) => new Date(new Date(start).getTime() + SLOTS.lengthHours * 3_600_000);
