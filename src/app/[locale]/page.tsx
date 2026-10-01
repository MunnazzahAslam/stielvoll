import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import BoxBuilder from "@/components/BoxBuilder";
import Flavours from "@/components/Flavours";
import FlyLayer from "@/components/FlyLayer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { About, Faq, HowItWorks, Visit } from "@/components/Sections";

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Flavours />
        <BoxBuilder />
        <HowItWorks />
        <About />
        <Visit />
        <Faq />
      </main>
      <Footer />
      <FlyLayer />
    </>
  );
}
