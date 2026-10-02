"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cartCount } from "@/lib/cart";
import CartDrawer from "./CartDrawer";
import { useCart } from "./hooks";
import LocaleSwitch from "./LocaleSwitch";
import Logo from "./Logo";

export default function Header() {
  const t = useTranslations("nav");
  const count = cartCount(useCart());
  const drawer = useRef<HTMLDialogElement>(null);

  return (
    <header className="sticky top-0 z-40 bg-frost">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 md:px-8">
        <Link href="/" aria-label={t("home")} className="text-[26px]">
          <Logo />
        </Link>

        <nav aria-label={t("main")} className="ml-auto hidden gap-7 text-[15px] font-semibold md:flex">
          {/* Section links also work from the checkout and order pages. */}
          <Link href={{ pathname: "/", hash: "flavours" }} className="hover:underline hover:underline-offset-4">{t("flavours")}</Link>
          <Link href={{ pathname: "/", hash: "box" }} className="hover:underline hover:underline-offset-4">{t("box")}</Link>
          <Link href={{ pathname: "/", hash: "visit" }} className="hover:underline hover:underline-offset-4">{t("visit")}</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LocaleSwitch />

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
