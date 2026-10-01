"use client";

import { useSyncExternalStore } from "react";
import { useFormatter, useLocale } from "next-intl";
import type { Localised } from "@/data/shop";
import type { Locale } from "@/i18n/routing";
import { getCart, getServerCart, subscribe } from "@/lib/cart";

/** The cart, kept in the browser. Empty on the server and during hydration. */
export const useCart = () => useSyncExternalStore(subscribe, getCart, getServerCart);

/** Cents to a price in the visitor's language: "3,90 €" or "€3.90". */
export function useMoney() {
  const format = useFormatter();
  return (cents: number) => format.number(cents / 100, { style: "currency", currency: "EUR" });
}

/** Picks the right language from a { de, en } pair. */
export function useLocalised() {
  const locale = useLocale() as Locale;
  return (text: Localised) => text[locale];
}
