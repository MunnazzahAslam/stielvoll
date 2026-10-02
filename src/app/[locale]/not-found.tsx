import { useTranslations } from "next-intl";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "@/i18n/navigation";
import PopsicleStill from "@/components/PopsicleStill";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <>
      <Header />
      <main className="mx-auto grid min-h-[70svh] max-w-[1200px] place-items-center px-5 py-16 text-center">
        <div>
          <PopsicleStill color="#E8434F" className="mx-auto h-40 w-auto rotate-12" />
          <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,3.6rem)] leading-none font-extrabold tracking-[-0.03em]">{t("title")}</h1>
          <p className="mt-3 text-lg text-currant/75">{t("text")}</p>
          <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-currant px-6 font-bold text-frost">
            {t("cta")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
