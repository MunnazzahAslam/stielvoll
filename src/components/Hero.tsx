"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FLAVOURS } from "@/data/shop";
import type { Locale } from "@/i18n/routing";
import { useFlavour } from "./FlavourProvider";
import PopsicleStill from "./PopsicleStill";

// three.js only loads in the browser, and only when the hero needs it.
const JellyPopsicle = dynamic(() => import("./JellyPopsicle"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

let webgl: boolean | undefined;
const hasWebGL = () => {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
};
const never = () => () => {};

export default function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale() as Locale;
  const { flavour, setFlavour } = useFlavour();

  // The 3D popsicle needs WebGL and a visitor who hasn't asked for less motion.
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED).matches, () => false);
  const supported = useSyncExternalStore(never, hasWebGL, () => false);
  const use3d = supported && !reduced;

  const stage = useRef<HTMLDivElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [bites, setBites] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const onDrag = useCallback(() => setDragged(true), []);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const headline = "font-display text-[clamp(2.6rem,11vw,3.4rem)] leading-[0.98] font-extrabold tracking-[-0.035em] md:text-[clamp(2.6rem,5.6vw,4.9rem)]";

  return (
    <section id="top" className="overflow-hidden bg-flavour text-flavour-ink transition-colors duration-300">
      <div className="mx-auto grid max-w-[1200px] justify-items-center px-5 pt-8 pb-9 text-center md:grid-cols-[1fr_minmax(260px,340px)_1fr] md:gap-x-8 md:px-8 md:py-[clamp(20px,4svh,44px)]">
        {/* One headline, set either side of the popsicle on wide screens. */}
        <h1 className="contents">
          <span className={`${headline} md:col-start-1 md:row-start-1 md:self-end md:justify-self-end md:text-right`}>
            {t("headline1")}
          </span>{" "}
          <span className={`${headline} md:col-start-3 md:row-start-1 md:self-end md:justify-self-start md:text-left`}>
            {t("headline2")}
          </span>
        </h1>

        <div
          ref={stage}
          className="relative mt-5 h-[min(50svh,400px)] w-full md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:h-[clamp(330px,62svh,520px)]"
        >
          {/* a flat disc of lighter flavour colour, so the popsicle stands off the background */}
          <div className="absolute top-1/2 left-1/2 aspect-square h-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" aria-hidden="true" />

          {/* The still popsicle shows first, and stays when 3D isn't available. */}
          <div
            className={`absolute inset-0 grid place-items-center transition-opacity duration-300 ${use3d && ready ? "opacity-0" : "opacity-100"}`}
            aria-hidden="true"
          >
            <PopsicleStill color={flavour.color} className="h-[76%] w-auto brightness-[0.92] saturate-[1.15]" />
          </div>

          {use3d && (
            // Wider than the column so the popsicle has room to swing.
            <div className="absolute inset-y-0 left-1/2 w-screen max-w-[720px] -translate-x-1/2">
              <JellyPopsicle color={flavour.color} hit={hit} onDrag={onDrag} onBite={setBites} fresh={fresh} onReady={onReady} running={onScreen} />
              <div
                ref={hit}
                role="img"
                aria-label={t("popsicle", { flavour: flavour.name[locale] })}
                className="absolute cursor-grab touch-none select-none data-[dragging]:cursor-grabbing"
              />
            </div>
          )}

          {use3d && (
            <p
              className={`pointer-events-none absolute top-[9%] left-[calc(50%+78px)] flex max-w-[112px] -rotate-6 items-start gap-1.5 text-left text-sm leading-tight font-bold transition-opacity duration-500 md:left-[calc(50%+96px)] md:max-w-none md:items-center md:whitespace-nowrap ${
                dragged || !ready ? "opacity-0" : "opacity-100"
              }`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 32 24" width="30" height="22" className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M30 4C20 3 9 7 4 18" />
                <path d="M3 9.5 4 18l8-2.5" />
              </svg>
              {t("hint")}
            </p>
          )}

          {/* After a bite: swap in a whole popsicle. */}
          {use3d && bites > 0 && (
            <button
              type="button"
              onClick={() => setFresh((n) => n + 1)}
              className="absolute bottom-[6%] left-[calc(50%+56px)] flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-bold whitespace-nowrap text-currant transition-transform hover:scale-105 active:scale-95 md:left-[calc(50%+72px)]"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                <path d="M4 4v5h5" />
              </svg>
              {t("fresh")}
            </button>
          )}
        </div>

        <p className="order-last mt-6 max-w-[30ch] text-lg leading-snug font-semibold md:order-none md:col-start-1 md:row-start-2 md:mt-5 md:self-start md:justify-self-end md:text-right">
          {t("subline")}
        </p>

        <div className="order-last mt-6 md:order-none md:col-start-3 md:row-start-2 md:mt-5 md:self-start md:justify-self-start">
          <a
            href="#box"
            className="inline-flex h-[52px] items-center rounded-full bg-currant px-7 text-base font-bold text-frost transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            {t("cta")}
          </a>
        </div>

        <div role="group" aria-label={t("flavours")} className="mt-6 grid w-full max-w-[420px] grid-cols-2 gap-2 md:col-span-3 md:row-start-3 md:mt-[clamp(14px,3svh,28px)] md:flex md:max-w-none md:flex-wrap md:justify-center">
          {FLAVOURS.map((f) => {
            const selected = f.id === flavour.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFlavour(f.id)}
                className={`flex h-10 items-center gap-2 rounded-full border-2 pr-3 pl-2.5 text-[13px] font-bold whitespace-nowrap md:pr-4 md:text-sm transition-[background-color,transform] active:scale-95 ${
                  selected ? "border-white bg-white text-currant" : "border-current/25 hover:border-current/60"
                }`}
              >
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white" style={{ background: f.color }} aria-hidden="true" />
                {f.name[locale]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
