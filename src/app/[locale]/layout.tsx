import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FlavourProvider } from "@/components/FlavourProvider";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Both are variable fonts: one file each covers the weights we use.
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

export const viewport: Viewport = { themeColor: "#F2F5F3" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${bricolage.variable} ${figtree.variable}`}>
      <body>
        <NextIntlClientProvider>
          <FlavourProvider>{children}</FlavourProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
