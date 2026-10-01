"use client";

import { useTranslations } from "next-intl";
import type { Flavour } from "@/data/shop";
import { useLocalised } from "./hooks";

/** Ingredients in order, with allergen ingredients in bold, as EU labelling expects. */
export function Ingredients({ flavour }: { flavour: Flavour }) {
  const l = useLocalised();
  return (
    <>
      {flavour.ingredients.map((ing, i) => (
        <span key={ing.name.en}>
          {i > 0 && ", "}
          {ing.allergen ? <strong className="font-bold">{l(ing.name)}</strong> : l(ing.name)}
        </span>
      ))}
    </>
  );
}

/** "Contains: milk" or "Allergens: none", plus "Vegan" where it applies. */
export function FlavourTags({ flavour, className = "" }: { flavour: Flavour; className?: string }) {
  const t = useTranslations("flavours");
  const l = useLocalised();
  return (
    <ul className={`flex flex-wrap gap-1.5 text-xs font-bold ${className}`}>
      <li
        className={`rounded-full px-2.5 py-1 ${
          flavour.allergens ? "bg-currant text-frost" : "border border-currant/25 text-currant/75"
        }`}
      >
        {flavour.allergens ? t("allergensContains", { allergens: l(flavour.allergens) }) : t("allergensNone")}
      </li>
      {flavour.vegan && <li className="rounded-full border border-currant/25 px-2.5 py-1 text-currant/75">{t("vegan")}</li>}
    </ul>
  );
}
