"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { BOX_PRICE_CENTS, BOX_SIZES, FLAVOURS, type BoxSize, type FlavourId } from "@/data/shop";
import { addBox, flyToCart, mixCount, mixSinglesCents, type Mix } from "@/lib/cart";
import { useFlavour } from "./FlavourProvider";
import { useLocalised, useMoney } from "./hooks";
import { FlavourTags, Ingredients } from "./Tags";

const squish = { type: "spring", stiffness: 420, damping: 13 } as const;

export default function BoxBuilder() {
  const t = useTranslations("box");
  const l = useLocalised();
  const money = useMoney();
  const { flavour } = useFlavour();
  const reduced = useReducedMotion();
  const [size, setSize] = useState<BoxSize>(6);
  const [mix, setMix] = useState<Mix>({});

  const count = mixCount(mix);
  const left = size - count;
  const change = (id: FlavourId, by: number) =>
    setMix((m) => {
      const n = Math.max(0, (m[id] ?? 0) + by);
      const next = { ...m };
      if (n === 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const singly = mixSinglesCents(mix);
  const saving = left === 0 ? singly - BOX_PRICE_CENTS[size] : 0;

  return (
    // A light tint of the flavour picked in the hero.
    <section id="box" aria-labelledby="box-title" className="bg-[color-mix(in_srgb,var(--color-flavour)_16%,var(--color-frost))] py-16 transition-colors duration-300 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 id="box-title" className="font-display text-[clamp(2.2rem,5vw,3.5rem)] leading-none font-extrabold tracking-[-0.03em]">
          {t("title")}
        </h2>
        <p className="mt-3 text-lg font-medium text-currant/75">
          {t("sub", { six: money(BOX_PRICE_CENTS[6]), twelve: money(BOX_PRICE_CENTS[12]) })}
        </p>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-currant/10 rounded-[28px] bg-white px-5 md:px-7">
            {FLAVOURS.map((f) => {
              const n = mix[f.id] ?? 0;
              return (
                // Phones: name and stepper on one line, details below at full width.
                <li key={f.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 py-4 md:gap-x-4 md:gap-y-0.5">
                  <span className="h-8 w-8 shrink-0 rounded-full md:row-span-2 md:h-10 md:w-10" style={{ background: f.color }} aria-hidden="true" />
                  <p className="font-display text-lg leading-tight font-extrabold md:self-end">{l(f.name)}</p>
                  <div className="col-span-3 md:col-span-1 md:col-start-2 md:row-start-2 md:self-start">
                    <p className="text-[13px] leading-snug text-currant/70">
                      <Ingredients flavour={f} />
                    </p>
                    <FlavourTags flavour={f} className="mt-1.5" />
                  </div>
                  <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-1 md:row-span-2" role="group" aria-label={t("quantity", { flavour: l(f.name), n })}>
                    <button
                      type="button"
                      onClick={() => change(f.id, -1)}
                      disabled={n === 0}
                      aria-label={t("less", { flavour: l(f.name) })}
                      className="grid h-11 w-11 place-items-center rounded-full border-2 border-currant/20 text-xl font-bold disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-lg font-bold tabular-nums" aria-hidden="true">{n}</span>
                    <button
                      type="button"
                      onClick={() => change(f.id, 1)}
                      disabled={left <= 0}
                      aria-label={t("more", { flavour: l(f.name) })}
                      className="grid h-11 w-11 place-items-center rounded-full bg-currant text-xl font-bold text-frost disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="rounded-[28px] bg-white p-6 md:p-7 lg:sticky lg:top-24">
            <div role="radiogroup" aria-label={t("size")} className="grid grid-cols-2 gap-2 rounded-full bg-frost p-1">
              {BOX_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={s === size}
                  onClick={() => setSize(s)}
                  className={`h-11 rounded-full text-[15px] font-bold transition-colors ${s === size ? "bg-currant text-frost" : "hover:bg-currant/10"}`}
                >
                  {t("sizeLabel", { size: s })} · <span className="tabular-nums">{money(BOX_PRICE_CENTS[s])}</span>
                </button>
              ))}
            </div>

            <p className="mt-6 flex items-baseline justify-between font-bold" aria-live="polite">
              <span>{t("chosen", { count, size })}</span>
              <span className="text-sm font-semibold text-currant/70">
                {left > 0 ? t("remaining", { n: left }) : left === 0 ? t("full") : t("over", { n: -left })}
              </span>
            </p>
            {/* fills as the box does, in the hero's flavour colour */}
            <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-frost" role="progressbar" aria-valuemin={0} aria-valuemax={size} aria-valuenow={Math.min(count, size)} aria-label={t("chosen", { count, size })}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: left < 0 ? "var(--color-currant)" : flavour.color }}
                animate={{ width: `${Math.min(100, (count / size) * 100)}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
            </div>

            <dl className="mt-6 space-y-2 text-[15px]">
              {count > 0 && (
                <div className="flex justify-between text-currant/70">
                  <dt>{t("singly")}</dt>
                  <dd className={`tabular-nums ${left === 0 ? "line-through" : ""}`}>{money(singly)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between font-bold">
                <dt>{t("boxPrice")}</dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums">{money(BOX_PRICE_CENTS[size])}</dd>
              </div>
            </dl>
            {saving > 0 && <p className="mt-1 text-right text-sm font-bold">{t("saving", { amount: money(saving) })}</p>}

            <motion.button
              type="button"
              disabled={left !== 0}
              whileTap={reduced ? undefined : { scaleX: 1.05, scaleY: 0.9 }}
              transition={squish}
              onClick={(e) => {
                addBox(size, mix);
                flyToCart(e.currentTarget, flavour.color);
                setMix({});
              }}
              className="mt-6 h-[52px] w-full rounded-full bg-currant font-bold text-frost disabled:opacity-35"
            >
              {t("add")}
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
