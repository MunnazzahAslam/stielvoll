"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { DELIVERY, deliveryDistrict, deliveryFeeCents, BOX_PRICE_CENTS } from "@/data/shop";
import { Link } from "@/i18n/navigation";
import { cartSubtotalCents, getCart, mixEntries } from "@/lib/cart";
import { slotEnd } from "@/lib/slots";
import { useCart, useLocalised, useMoney } from "./hooks";

type Fulfilment = "pickup" | "delivery";
type Details = { name: string; email: string; phone: string; fulfilment: Fulfilment; address: string; postcode: string };
type Field = keyof Details | "slot";
type SlotDay = { date: string; slots: { start: string; full: boolean }[] };
type Slots = { state: "loading" } | { state: "error" } | { state: "ready"; days: SlotDay[] };

const STORE = "stielvoll-checkout-v1";
const BLANK: Details = { name: "", email: "", phone: "", fulfilment: "pickup", address: "", postcode: "" };
const never = () => () => {};

/** The details typed so far survive a trip to Stripe and back (cancelled payment). */
function loadDetails(): Details {
  try {
    return { ...BLANK, ...JSON.parse(sessionStorage.getItem(STORE) ?? "{}") };
  } catch {
    return BLANK;
  }
}

/** Mirrors the server's checks, so most mistakes show before anything is sent. */
function check(d: Details, slot: string | null): Field[] {
  return [
    d.name.trim().length < 2 && "name",
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) && "email",
    (d.phone.replace(/\D/g, "").length < 6 || !/^[+\d\s()/-]+$/.test(d.phone.trim())) && "phone",
    d.fulfilment === "delivery" && d.address.trim().length < 4 && "address",
    d.fulfilment === "delivery" && !/^\d{5}$/.test(d.postcode.trim()) && "postcode",
    !slot && "slot",
  ].filter((f): f is Field => !!f);
}

/** "YYYY-MM-DD" in shop time, days from today. */
const shopDate = (days = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

export default function CheckoutForm({ mode, cancelled }: { mode: "stripe" | "demo"; cancelled: boolean }) {
  // The cart lives in the browser: wait for it rather than flash "empty" first.
  const hydrated = useSyncExternalStore(never, () => true, () => false);
  const cart = useCart();
  const t = useTranslations("checkout");
  const empty = cart.boxes.length === 0 && Object.keys(cart.singles).length === 0;

  if (!hydrated) return <div className="min-h-[60svh]" aria-busy="true" />;
  if (empty)
    return (
      <div className="grid min-h-[50svh] place-items-center text-center">
        <div>
          <p className="font-display text-2xl font-extrabold">{t("emptyTitle")}</p>
          <Link href={{ pathname: "/", hash: "flavours" }} className="mt-5 inline-flex h-12 items-center rounded-full bg-currant px-6 font-bold text-frost">
            {t("emptyCta")}
          </Link>
        </div>
      </div>
    );
  return <Form mode={mode} cancelled={cancelled} />;
}

function Form({ mode, cancelled }: { mode: "stripe" | "demo"; cancelled: boolean }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const format = useFormatter();
  const money = useMoney();
  const l = useLocalised();
  const cart = useCart();

  const [details, setDetails] = useState<Details>(loadDetails);
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>({ state: "loading" });
  const [invalid, setInvalid] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const alert = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<Details>) => {
    const next = { ...details, ...patch };
    setDetails(next);
    setInvalid((fields) => fields.filter((f) => !(f in patch)));
    try {
      sessionStorage.setItem(STORE, JSON.stringify(next));
    } catch {}
  };

  const loadSlots = useCallback(async () => {
    setSlots({ state: "loading" });
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const { days } = (await res.json()) as { days: SlotDay[] };
      setSlots({ state: "ready", days });
      // Drop a choice that has since filled up or passed.
      setSlot((current) => (days.some((d) => d.slots.some((s) => s.start === current && !s.full)) ? current : null));
    } catch {
      setSlots({ state: "error" });
    }
  }, []);

  useEffect(() => {
    // Fetching on mount is the point here: slots fill up while the page is open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
  }, [loadSlots]);

  const subtotal = cartSubtotalCents(cart);
  const delivering = details.fulfilment === "delivery";
  const fee = delivering ? deliveryFeeCents(subtotal) : 0;
  const postcode = details.postcode.trim();
  const district = /^\d{5}$/.test(postcode) ? deliveryDistrict(postcode) : null;
  const outside = delivering && /^\d{5}$/.test(postcode) && !district;

  const showError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => alert.current?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = check(details, slot);
    if (fields.length || outside) {
      setInvalid(outside ? [...fields, "postcode"] : fields);
      return showError(t(outside ? "errors.postcode_outside" : "errors.invalid_details"));
    }

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, cart: getCart(), details: { ...details, slot } }),
      });
      const data = (await res.json()) as { url?: string; error?: string; fields?: Field[] };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return; // Stay "pending" while the browser leaves.
      }
      setInvalid(data.fields ?? []);
      if (data.error === "slot_full" || data.error === "slot_unavailable") loadSlots();
      showError(t.has(`errors.${data.error}`) ? t(`errors.${data.error}` as "errors.network") : t("errors.network"));
    } catch {
      showError(t("errors.network"));
    }
    setPending(false);
  }

  const time = (iso: string | Date) => format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const dayLabel = (date: string) => {
    const name = date === shopDate(0) ? t("today") : date === shopDate(1) ? t("tomorrow") : null;
    const full = format.dateTime(new Date(`${date}T12:00:00Z`), { weekday: name ? undefined : "long", day: "numeric", month: "long" });
    return name ? `${name}, ${full}` : full;
  };
  const fieldError = (f: Field) => (invalid.includes(f) ? t(`fieldErrors.${f}` as "fieldErrors.name") : null);

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-14">
      <div className="space-y-10">
        {cancelled && (
          <p role="status" className="rounded-3xl bg-white p-5 font-semibold">
            {t("cancelled")}
          </p>
        )}

        <Fieldset legend={t("contact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t("name")} name="name" autoComplete="name" value={details.name} onChange={(v) => update({ name: v })} error={fieldError("name")} className="sm:col-span-2" />
            <Input label={t("email")} name="email" type="email" autoComplete="email" value={details.email} onChange={(v) => update({ email: v })} error={fieldError("email")} />
            <Input label={t("phone")} name="phone" type="tel" autoComplete="tel" value={details.phone} onChange={(v) => update({ phone: v })} error={fieldError("phone")} hint={t("phoneHint")} />
          </div>
        </Fieldset>

        <Fieldset legend={t("fulfilment")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["pickup", "delivery"] as const).map((f) => (
              <label key={f} className="flex cursor-pointer gap-3 rounded-3xl border-2 border-transparent bg-white p-4 has-checked:border-currant has-focus-visible:outline-2 has-focus-visible:outline-offset-3">
                <input type="radio" name="fulfilment" value={f} checked={details.fulfilment === f} onChange={() => update({ fulfilment: f })} className="mt-1 h-5 w-5 shrink-0 accent-currant" />
                <span>
                  <span className="block font-display text-lg font-extrabold">{t(f)}</span>
                  <span className="text-sm text-currant/75">
                    {f === "pickup" ? t("pickupText") : t("deliveryText", { fee: money(DELIVERY.feeCents), free: money(DELIVERY.freeFromCents) })}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {delivering && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
              <Input label={t("address")} name="address" autoComplete="street-address" value={details.address} onChange={(v) => update({ address: v })} error={fieldError("address")} />
              <Input
                label={t("postcode")}
                name="postcode"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={5}
                value={details.postcode}
                onChange={(v) => update({ postcode: v.replace(/\D/g, "") })}
                error={outside ? null : fieldError("postcode")}
                invalid={outside}
              />
              <div aria-live="polite" className="sm:col-span-2">
                {district && (
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#7CC38F] text-xs" aria-hidden="true">✓</span>
                    {t("postcodeOk", { district })}
                  </p>
                )}
                {outside && (
                  <div className="rounded-3xl border-2 border-currant bg-white p-4">
                    <p className="font-semibold">{t("postcodeOutside", { postcode })}</p>
                    <button type="button" onClick={() => update({ fulfilment: "pickup" })} className="mt-3 h-11 rounded-full bg-currant px-5 text-sm font-bold text-frost">
                      {t("switchToPickup")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Fieldset>

        <Fieldset legend={t("slot")} hint={t("slotHint")} error={fieldError("slot")}>
          {slots.state === "loading" && <p className="text-currant/70">{t("slotsLoading")}</p>}
          {slots.state === "error" && (
            <p className="flex flex-wrap items-center gap-3">
              {t("slotsError")}
              <button type="button" onClick={loadSlots} className="h-10 rounded-full border-2 border-currant px-4 text-sm font-bold">
                {t("retry")}
              </button>
            </p>
          )}
          {slots.state === "ready" && slots.days.length === 0 && <p>{t("slotNone")}</p>}
          {slots.state === "ready" &&
            slots.days.map((day) => (
              <div key={day.date} className="mt-4 first:mt-0">
                <p className="mb-2 font-semibold">{dayLabel(day.date)}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {day.slots.map((s) => (
                    <label
                      key={s.start}
                      className="relative grid h-14 cursor-pointer place-items-center rounded-2xl border-2 border-currant/15 bg-white text-center font-bold tabular-nums has-checked:border-currant has-checked:bg-currant has-checked:text-frost has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:bg-transparent has-disabled:text-currant/45 has-focus-visible:outline-2 has-focus-visible:outline-offset-3"
                    >
                      <input type="radio" name="slot" value={s.start} checked={slot === s.start} disabled={s.full} onChange={() => (setSlot(s.start), setInvalid((f) => f.filter((x) => x !== "slot")))} className="sr-only" />
                      <span className="leading-tight">
                        {t("slotTime", { from: time(s.start), to: time(slotEnd(s.start)) })}
                        {s.full && <span className="block text-xs font-semibold">{t("slotFull")}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </Fieldset>
      </div>

      <aside className="rounded-[28px] bg-white p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{t("summary")}</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.boxes.map((box) => (
            <li key={box.id}>
              <p className="flex justify-between gap-3 font-bold">
                <span>{tc("boxOf", { size: box.size })}</span>
                <span className="tabular-nums">{money(BOX_PRICE_CENTS[box.size])}</span>
              </p>
              <p className="text-currant/70">{mixEntries(box.mix).map(({ flavour, quantity }) => `${quantity} × ${l(flavour.name)}`).join(", ")}</p>
            </li>
          ))}
          {mixEntries(cart.singles).map(({ flavour, quantity }) => (
            <li key={flavour.id} className="flex justify-between gap-3">
              <span>
                <span className="font-bold tabular-nums">{quantity} ×</span> {l(flavour.name)}
              </span>
              <span className="tabular-nums">{money(flavour.priceCents * quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-1.5 border-t border-currant/10 pt-4">
          <div className="flex justify-between">
            <dt>{t("subtotal")}</dt>
            <dd className="tabular-nums">{money(subtotal)}</dd>
          </div>
          {delivering && (
            <div className="flex justify-between">
              <dt>{t("deliveryFee")}</dt>
              <dd className="tabular-nums">{fee ? money(fee) : t("free")}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-2 font-bold">
            <dt>{t("total")}</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">{money(subtotal + fee)}</dd>
          </div>
        </dl>

        <div ref={alert} role="alert" className="empty:hidden">
          {error && <p className="mt-4 rounded-2xl bg-[#E8434F]/12 p-3 text-sm font-semibold">{error}</p>}
        </div>

        <button type="submit" disabled={pending} className="mt-5 h-[52px] w-full rounded-full bg-currant font-bold text-frost disabled:opacity-60">
          {pending ? t("paying") : mode === "stripe" ? t("pay") : t("payDemo")}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-currant/65">{mode === "stripe" ? t("testNote") : t("demoNote")}</p>
      </aside>
    </form>
  );
}

function Fieldset({ legend, hint, error, children }: { legend: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-2xl font-extrabold tracking-[-0.02em]">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-currant/70">{hint}</p>}
      {error && <p className="mt-2 text-sm font-bold text-[#B3202C]">{error}</p>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  invalid?: boolean;
  hint?: string;
  className?: string;
} & Pick<React.InputHTMLAttributes<HTMLInputElement>, "type" | "autoComplete" | "inputMode" | "maxLength">;

function Input({ label, name, value, onChange, error, invalid, hint, className = "", ...rest }: InputProps) {
  const id = `checkout-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || invalid || undefined}
        aria-describedby={describedBy}
        className="h-12 w-full rounded-2xl border-2 border-currant/15 bg-white px-4 text-base outline-none focus:border-currant aria-invalid:border-[#B3202C]"
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-bold text-[#B3202C]">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-currant/65">
          {hint}
        </p>
      )}
    </div>
  );
}
