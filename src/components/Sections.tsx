import { useFormatter, useTranslations } from "next-intl";
import { DELIVERY } from "@/data/shop";

const h2 = "font-display text-[clamp(2.2rem,5vw,3.5rem)] leading-none font-extrabold tracking-[-0.03em]";
type Pair = { title: string; text: string };

export function HowItWorks() {
  const t = useTranslations("how");
  const steps = t.raw("steps") as Pair[];
  return (
    <section aria-labelledby="how-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 id="how-title" className={h2}>{t("title")}</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-[28px] bg-white p-7">
              <span className="font-display text-5xl leading-none font-extrabold tabular-nums text-flavour transition-colors duration-300">{i + 1}</span>
              <h3 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2 leading-relaxed font-medium text-currant/75">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function About() {
  const t = useTranslations("about");
  const points = t.raw("points") as Pair[];
  return (
    <section aria-labelledby="about-title" className="bg-currant py-16 text-frost md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 id="about-title" className={`${h2} max-w-[16ch]`}>{t("title")}</h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {points.map((p) => (
            <li key={p.title} className="border-t-2 border-frost/25 pt-5">
              <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{p.title}</h3>
              <p className="mt-2 leading-relaxed font-medium text-frost/75">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A drawn map: Ottensen above the Elbe, with a pin for the shop. Not to scale. */
function OttensenMap({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 520 380" role="img" aria-label={label} className="h-auto w-full">
      <rect width="520" height="380" fill="#fff" />
      {/* the Elbe */}
      <path d="M0 300c90-18 170 14 260 2s170-26 260-8v86H0Z" fill="#6A5ACD" opacity="0.22" />
      <text x="40" y="350" fontSize="15" fontWeight="700" fill="#2A1630" opacity="0.55" letterSpacing="3">ELBE</text>
      {/* blocks of streets */}
      {[
        [30, 30, 110, 70], [160, 30, 130, 70], [310, 30, 90, 70], [420, 30, 70, 70],
        [30, 120, 80, 80], [130, 120, 110, 80], [370, 120, 120, 80],
        [30, 220, 150, 50], [200, 220, 110, 50], [330, 220, 160, 50],
      ].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="14" fill="#F2F5F3" />
      ))}
      {/* a small park */}
      <rect x="260" y="120" width="90" height="80" rx="14" fill="#7CC38F" opacity="0.35" />
      <text x="44" y="60" fontSize="13" fontWeight="700" fill="#2A1630" opacity="0.5" letterSpacing="2">OTTENSEN</text>
      <text x="382" y="150" fontSize="13" fontWeight="700" fill="#2A1630" opacity="0.5" letterSpacing="2">ALTONA</text>
      {/* the shop: a popsicle for a pin */}
      <g transform="translate(185 108)">
        <circle cx="0" cy="52" r="46" className="fill-flavour opacity-20 transition-[fill] duration-300" />
        <rect x="-5" y="52" width="10" height="34" rx="5" fill="#D8B98A" />
        <rect x="-17" y="6" width="34" height="56" rx="15" className="fill-flavour transition-[fill] duration-300" />
        <rect x="-44" y="-30" width="88" height="28" rx="14" fill="#2A1630" />
        <text x="0" y="-11" textAnchor="middle" fontSize="13" fontWeight="800" fill="#F2F5F3">stielvoll</text>
      </g>
    </svg>
  );
}

export function Visit() {
  const t = useTranslations("visit");
  const format = useFormatter();
  const money = (cents: number) => format.number(cents / 100, { style: "currency", currency: "EUR" });
  const hours = t.raw("hours") as string[];
  const h3 = "font-display text-xl font-extrabold tracking-[-0.02em]";

  return (
    <section id="visit" aria-labelledby="visit-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 id="visit-title" className={h2}>{t("title")}</h2>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[28px]">
            <OttensenMap label={t("mapAlt")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[28px] bg-white p-6 sm:col-span-2">
              <h3 className={h3}>{t("hoursTitle")}</h3>
              <ul className="mt-2 space-y-1 font-medium text-currant/80">
                {hours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] bg-white p-6">
              <h3 className={h3}>{t("pickupTitle")}</h3>
              <p className="mt-2 font-medium text-currant/80">{t("pickup")}</p>
            </div>
            <div className="rounded-[28px] bg-white p-6">
              <h3 className={h3}>{t("deliveryTitle")}</h3>
              <p className="mt-2 font-medium text-currant/80">{t("delivery")}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5 text-sm font-bold">
                {DELIVERY.districts.map((d) => (
                  <li key={d} className="rounded-full bg-frost px-3 py-1">{d}</li>
                ))}
              </ul>
              <p className="mt-3 font-bold">{t("fee", { fee: money(DELIVERY.feeCents), free: money(DELIVERY.freeFromCents) })}</p>
              <p className="mt-1 text-sm font-medium text-currant/70">{t("elsewhere")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];
  return (
    <section id="faq" aria-labelledby="faq-title" className="pb-16 md:pb-24">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 md:px-8 lg:grid-cols-[1fr_1.6fr]">
        <h2 id="faq-title" className={h2}>{t("title")}</h2>
        {/* Native <details> with a shared name: one answer open at a time. */}
        <div className="space-y-3">
          {items.map(({ q, a }, i) => (
            <details key={q} name="faq" open={i === 0} className="group rounded-[24px] bg-white px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-lg font-extrabold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-frost text-xl leading-none transition-transform duration-300 group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="max-w-[60ch] pb-5 leading-relaxed font-medium text-currant/80">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
