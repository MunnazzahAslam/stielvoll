"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { FLAVOURS } from "@/data/shop";
import { addSingle, flyToCart } from "@/lib/cart";
import { useFlavour } from "./FlavourProvider";
import { useLocalised, useMoney } from "./hooks";
import PopsicleStill from "./PopsicleStill";
import { FlavourTags, Ingredients } from "./Tags";

/** A quick, bouncy spring: the 2D cousin of the jelly in the hero. */
const squish = { type: "spring", stiffness: 420, damping: 13 } as const;
/** With reduced motion: a gentle scale, no bounce. */
const gentle = { type: "tween", duration: 0.2, ease: "easeOut" } as const;

export default function Flavours() {
  const t = useTranslations("flavours");
  const l = useLocalised();
  const money = useMoney();
  const { setFlavour } = useFlavour();
  const reduced = useReducedMotion();

  return (
    <section id="flavours" aria-labelledby="flavours-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 id="flavours-title" className="font-display text-[clamp(2.2rem,5vw,3.5rem)] leading-none font-extrabold tracking-[-0.03em]">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-[44ch] text-lg font-medium text-currant/75">{t("sub")}</p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FLAVOURS.map((f) => (
            <motion.li
              key={f.id}
              whileHover={{ scale: reduced ? 1.01 : 1.025 }}
              whileTap={reduced ? undefined : { scaleX: 1.03, scaleY: 0.965 }}
              transition={reduced ? gentle : squish}
              className="flex flex-col overflow-hidden rounded-[28px] bg-white"
            >
              {/* The picture also switches the hero to this flavour. */}
              <button
                type="button"
                onClick={() => {
                  setFlavour(f.id);
                  document.getElementById("top")?.scrollIntoView();
                }}
                aria-label={t("show", { flavour: l(f.name) })}
                className="grid h-44 place-items-center"
                style={{ background: f.color }}
              >
                <PopsicleStill color="#fff" className="h-36 w-auto -rotate-6 opacity-95" />
              </button>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em]">{l(f.name)}</h3>
                  <p className="text-right leading-tight">
                    <span className="block text-xl font-bold tabular-nums">{money(f.priceCents)}</span>
                    <span className="text-xs font-medium text-currant/60">{t("perPiece")}</span>
                  </p>
                </div>
                <p className="mt-2 font-medium text-currant/80">{l(f.line)}</p>

                {/* Shown before the add button, never behind a click. */}
                <p className="mt-4 text-sm leading-relaxed text-currant/80">
                  <span className="font-bold text-currant">{t("ingredients")}: </span>
                  <Ingredients flavour={f} />
                </p>
                <FlavourTags flavour={f} className="mt-3 mb-6" />

                <motion.button
                  type="button"
                  whileTap={reduced ? undefined : { scaleX: 1.06, scaleY: 0.88 }}
                  transition={squish}
                  onClick={(e) => {
                    addSingle(f.id);
                    flyToCart(e.currentTarget, f.color);
                  }}
                  aria-label={t("addNamed", { flavour: l(f.name) })}
                  className="mt-auto h-12 shrink-0 rounded-full bg-currant text-[15px] font-bold text-frost"
                >
                  {t("add")}
                </motion.button>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
