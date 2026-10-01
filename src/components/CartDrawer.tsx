"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { BOX_PRICE_CENTS, type Flavour } from "@/data/shop";
import { cartSubtotalCents, mixEntries, removeBox, setSingle } from "@/lib/cart";
import { useCart, useLocalised, useMoney } from "./hooks";

export default function CartDrawer({ dialog }: { dialog: RefObject<HTMLDialogElement | null> }) {
  const t = useTranslations("cart");
  const l = useLocalised();
  const money = useMoney();
  const cart = useCart();
  const close = () => dialog.current?.close();

  const singles = mixEntries(cart.singles);
  const empty = singles.length === 0 && cart.boxes.length === 0;
  const allergens = (f: Flavour) => (f.allergens ? t("contains", { allergens: l(f.allergens) }) : null);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="cart-title"
      onClick={(e) => e.target === dialog.current && close()}
      className="fixed top-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(440px,100vw)] max-w-none bg-frost p-0 text-currant backdrop:bg-currant/50"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <h2 id="cart-title" className="font-display text-2xl font-extrabold tracking-[-0.02em]">{t("title")}</h2>
          <button type="button" onClick={close} aria-label={t("close")} className="grid h-11 w-11 place-items-center rounded-full hover:bg-currant/10">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {empty ? (
          <div className="grid flex-1 place-items-center px-5 text-center">
            <div>
              <p className="text-lg font-semibold">{t("empty")}</p>
              <a href="#flavours" onClick={close} className="mt-4 inline-flex h-12 items-center rounded-full bg-currant px-6 font-bold text-frost">
                {t("emptyCta")}
              </a>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto px-5 pb-5">
              {cart.boxes.map((box) => (
                <li key={box.id} className="rounded-3xl bg-white p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg font-extrabold">{t("boxOf", { size: box.size })}</p>
                    <p className="font-bold tabular-nums">{money(BOX_PRICE_CENTS[box.size])}</p>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-currant/80">
                    {mixEntries(box.mix).map(({ flavour, quantity }) => (
                      <li key={flavour.id} className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: flavour.color }} aria-hidden="true" />
                        <span className="tabular-nums">{quantity} ×</span> {l(flavour.name)}
                        {flavour.allergens && <span className="text-xs font-bold text-currant">· {allergens(flavour)}</span>}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => removeBox(box.id)}
                    aria-label={t("removeNamed", { item: t("boxOf", { size: box.size }) })}
                    className="mt-3 text-sm font-bold underline underline-offset-4"
                  >
                    {t("remove")}
                  </button>
                </li>
              ))}

              {singles.map(({ flavour, quantity }) => (
                <li key={flavour.id} className="flex items-center gap-3 rounded-3xl bg-white p-4">
                  <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: flavour.color }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display leading-tight font-extrabold">{l(flavour.name)}</p>
                    <p className="text-sm text-currant/70 tabular-nums">{money(flavour.priceCents * quantity)}</p>
                    {flavour.allergens && <p className="text-xs font-bold">{allergens(flavour)}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setSingle(flavour.id, quantity - 1)} aria-label={t("less", { flavour: l(flavour.name) })} className="grid h-10 w-10 place-items-center rounded-full border-2 border-currant/20 text-lg font-bold">
                      −
                    </button>
                    <span className="w-6 text-center font-bold tabular-nums">{quantity}</span>
                    <button type="button" onClick={() => setSingle(flavour.id, quantity + 1)} aria-label={t("more", { flavour: l(flavour.name) })} className="grid h-10 w-10 place-items-center rounded-full bg-currant text-lg font-bold text-frost">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-currant/10 bg-white px-5 py-5">
              <p className="flex items-baseline justify-between font-bold">
                <span>{t("subtotal")}</span>
                <span className="font-display text-2xl font-extrabold tabular-nums">{money(cartSubtotalCents(cart))}</span>
              </p>
              <p className="mt-1 text-sm text-currant/70">{t("note")}</p>
              <button type="button" disabled className="mt-4 h-[52px] w-full rounded-full bg-currant font-bold text-frost disabled:opacity-40">
                {t("checkout")}
              </button>
              <p className="mt-2 text-center text-xs font-medium text-currant/60">{t("soon")}</p>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
