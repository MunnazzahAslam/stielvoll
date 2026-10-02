"use client";

import { useTranslations } from "next-intl";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <main className="grid min-h-svh place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] leading-none font-extrabold tracking-[-0.03em]">{t("title")}</h1>
        <p className="mt-3 text-lg text-currant/75">{t("text")}</p>
        <button type="button" onClick={reset} className="mt-6 h-12 rounded-full bg-currant px-6 font-bold text-frost">
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
