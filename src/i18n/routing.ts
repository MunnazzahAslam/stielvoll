import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  // German lives at /, English at /en.
  localePrefix: "as-needed",
  // German first for everyone; English is one tap away, never a redirect.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
