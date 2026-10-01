import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FlavourProvider } from "@/components/FlavourProvider";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/server/env";
import { bricolage, figtree } from "../fonts";
import "../globals.css";


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = locale === routing.defaultLocale ? "/" : `/${locale}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("title"), template: "%s · Stielvoll" },
    description: t("description"),
    applicationName: "Stielvoll",
    alternates: { canonical: path, languages: { de: "/", en: "/en", "x-default": "/" } },
    openGraph: {
      type: "website",
      siteName: "Stielvoll",
      title: t("title"),
      description: t("description"),
      url: path,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: locale === "de" ? "en_GB" : "de_DE",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
  };
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
