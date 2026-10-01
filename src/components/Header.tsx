"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cartCount } from "@/lib/cart";
import CartDrawer from "./CartDrawer";
import { useCart } from "./hooks";
import Logo from "./Logo";

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const count = cartCount(useCart());
  const drawer = useRef<HTMLDialogElement>(null);

  return (
    <header className="sticky top-0 z-40 bg-frost">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 md:px-8">
        <Link href="/" aria-label={t("home")} className="text-[26px]">
          <Logo />
        </Link>

        <nav aria-label={t("main")} className="ml-auto hidden gap-7 text-[15px] font-semibold md:flex">
          <a href="#flavours" className="hover:underline hover:underline-offset-4">{t("flavours")}</a>
          <a href="#box" className="hover:underline hover:underline-offset-4">{t("box")}</a>
          <a href="#visit" className="hover:underline hover:underline-offset-4">{t("visit")}</a>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {/* DE / EN switch: the current language is marked, the other is a link. */}
          <div className="flex items-center rounded-full border border-currant/20 p-0.5 text-[13px] font-bold">
            {(["de", "en"] as const).map((l) =>
              l === locale ? (
                <span key={l} aria-current="true" className="rounded-full bg-currant px-2.5 py-1 text-frost uppercase">
                  {l}
                </span>
              ) : (
                <Link key={l} href="/" locale={l} aria-label={t("switchTo")} className="rounded-full px-2.5 py-1 uppercase hover:bg-currant/10">
                  {l}
                </Link>
              ),
            )}
          </div>

          <button
            id="cart-button"
            type="button"
            onClick={() => drawer.current?.showModal()}
            aria-label={`${t("cartOpen")}. ${t("cartCount", { count })}`}
            aria-haspopup="dialog"
            className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-currant/10"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            {/* The badge squishes each time the count changes. */}
            <motion.span
              key={count}
              initial={{ scale: 1.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 11 }}
              className="absolute top-1 right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-currant px-1 text-[11px] font-bold text-frost tabular-nums"
              aria-hidden="true"
            >
              {count}
            </motion.span>
          </button>
        </div>
      </div>
      <CartDrawer dialog={drawer} />
    </header>
  );
}
