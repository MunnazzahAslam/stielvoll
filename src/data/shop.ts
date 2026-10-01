/** Shop data. Copy lives in messages/*.json; names and facts that belong to a flavour live here. */

export type Localised = { de: string; en: string };

export type FlavourId = "strawberry-basil" | "mango-passion" | "cucumber-mint" | "lemon-ginger" | "blueberry-lavender" | "raspberry-rose";

export type Ingredient = { name: Localised; allergen?: true };

export type Flavour = {
  id: FlavourId;
  name: Localised;
  /** Hero background and popsicle colour. */
  color: string;
  /** Hero text colour that stays readable (4.5:1 or better) on `color`. */
  ink: string;
  /** One line about the taste. */
  line: Localised;
  /** In order of quantity. Allergen ingredients are flagged so they can be emphasised, as EU labelling expects. */
  ingredients: Ingredient[];
  /** null: none of the 14 EU allergens. */
  allergens: Localised | null;
  vegan: boolean;
  priceCents: number;
};

const BLACKCURRANT = "#2A1630";

export const FLAVOURS: Flavour[] = [
  {
    id: "strawberry-basil",
    name: { de: "Erdbeer Basilikum", en: "Strawberry Basil" },
    color: "#E8434F",
    // Blackcurrant reaches only 4.26:1 on this red, so the hero uses a deeper shade of it.
    ink: "#1F0F24",
    line: { de: "Süße Erdbeeren, dazu eine grüne Note Basilikum.", en: "Sweet strawberries with a green edge of basil." },
    ingredients: [
      { name: { de: "Erdbeeren", en: "Strawberries" } },
      { name: { de: "Rohrzucker", en: "cane sugar" } },
      { name: { de: "Zitronensaft", en: "lemon juice" } },
      { name: { de: "Basilikum", en: "basil" } },
    ],
    allergens: null,
    vegan: true,
    priceCents: 390,
  },
  {
    id: "mango-passion",
    name: { de: "Mango Maracuja", en: "Mango Passion" },
    color: "#F6A821",
    ink: BLACKCURRANT,
    line: { de: "Reife Mango, herbe Maracuja.", en: "Ripe mango, sharp passion fruit." },
    ingredients: [
      { name: { de: "Mango", en: "Mango" } },
      { name: { de: "Maracuja", en: "passion fruit" } },
      { name: { de: "Rohrzucker", en: "cane sugar" } },
      { name: { de: "Limette", en: "lime" } },
    ],
    allergens: null,
    vegan: true,
    priceCents: 420,
  },
  {
    id: "cucumber-mint",
    name: { de: "Gurke Minze", en: "Cucumber Mint" },
    color: "#7CC38F",
    ink: BLACKCURRANT,
    line: { de: "Kühle Gurke, frische Minze, kaum süß.", en: "Cool cucumber and fresh mint, barely sweet." },
    ingredients: [
      { name: { de: "Gurke", en: "Cucumber" } },
      { name: { de: "Apfelsaft", en: "apple juice" } },
      { name: { de: "Rohrzucker", en: "cane sugar" } },
      { name: { de: "Minze", en: "mint" } },
    ],
    allergens: null,
    vegan: true,
    priceCents: 390,
  },
  {
    id: "lemon-ginger",
    name: { de: "Zitrone Ingwer", en: "Lemon Ginger" },
    color: "#F2D64B",
    ink: BLACKCURRANT,
    line: { de: "Erst sauer, dann warm.", en: "Sour first, then warm." },
    ingredients: [
      { name: { de: "Zitronensaft", en: "Lemon juice" } },
      { name: { de: "Wasser", en: "water" } },
      { name: { de: "Rohrzucker", en: "cane sugar" } },
      { name: { de: "Ingwer", en: "ginger" } },
    ],
    allergens: null,
    vegan: true,
    priceCents: 390,
  },
  {
    id: "blueberry-lavender",
    name: { de: "Blaubeere Lavendel", en: "Blueberry Lavender" },
    color: "#6A5ACD",
    ink: "#FFFFFF",
    line: { de: "Dunkle Beeren mit Haferdrink und einem Hauch Lavendel.", en: "Dark berries with oat drink and a little lavender." },
    ingredients: [
      { name: { de: "Blaubeeren", en: "Blueberries" } },
      { name: { de: "Haferdrink", en: "oat drink" }, allergen: true },
      { name: { de: "Rohrzucker", en: "cane sugar" } },
      { name: { de: "Lavendel", en: "lavender" } },
    ],
    allergens: { de: "Gluten (Hafer)", en: "Gluten (oats)" },
    vegan: false,
    priceCents: 450,
  },
  {
    id: "raspberry-rose",
    name: { de: "Himbeere Rose", en: "Raspberry Rose" },
    color: "#E36A9A",
    ink: BLACKCURRANT,
    line: { de: "Himbeeren und Joghurt, mit Rosenwasser abgerundet.", en: "Raspberries and yoghurt, finished with rose water." },
    ingredients: [
      { name: { de: "Himbeeren", en: "Raspberries" } },
      { name: { de: "Joghurt", en: "yoghurt" }, allergen: true },
      { name: { de: "Rohrzucker", en: "cane sugar" } },
      { name: { de: "Rosenwasser", en: "rose water" } },
    ],
    allergens: { de: "Milch", en: "Milk" },
    vegan: false,
    priceCents: 450,
  },
];

export const flavourById = (id: FlavourId) => FLAVOURS.find((f) => f.id === id)!;

/** Boxes: any mix of flavours at a fixed price. */
export const BOX_SIZES = [6, 12] as const;
export type BoxSize = (typeof BOX_SIZES)[number];
export const BOX_PRICE_CENTS: Record<BoxSize, number> = { 6: 2100, 12: 3900 };

/** Same-day delivery inside Hamburg only: frozen goods can't be posted. */
export const DELIVERY = {
  districts: ["Altona", "Ottensen", "Eimsbüttel", "Sternschanze", "St. Pauli", "HafenCity"],
  feeCents: 490,
  freeFromCents: 3500,
};
