import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutForm from "@/components/CheckoutForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { stripe } from "@/lib/server/stripe";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("checkout"), robots: { index: false } };
}

export default async function CheckoutPage({ params, searchParams }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { cancelled } = await searchParams;
  const t = await getTranslations("checkout");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 pt-6 pb-20 md:px-8 md:pt-10">
        <Link href="/" className="text-sm font-bold underline underline-offset-4">
          ← {t("back")}
        </Link>
        <h1 className="mt-4 mb-8 font-display text-[clamp(2.4rem,6vw,3.8rem)] leading-none font-extrabold tracking-[-0.03em]">{t("title")}</h1>
        <CheckoutForm mode={stripe() ? "stripe" : "demo"} cancelled={!!cancelled} />
      </main>
      <Footer />
    </>
  );
}
