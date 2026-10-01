"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** DE / EN: the current language is marked, the other is a link to the same page. */
export default function LocaleSwitch() {
  return (
    <Suspense fallback={<Switch query="" />}>
      <WithQuery />
    </Suspense>
  );
}

// The query matters on the order page, where it carries the link to the order.
function WithQuery() {
  return <Switch query={useSearchParams().toString()} />;
}

function Switch({ query }: { query: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <div className="flex items-center rounded-full border border-currant/20 p-0.5 text-[13px] font-bold">
      {routing.locales.map((l) =>
        l === locale ? (
          <span key={l} aria-current="true" className="rounded-full bg-currant px-2.5 py-1 text-frost uppercase">
            {l}
          </span>
        ) : (
          <Link key={l} href={href} locale={l} lang={l} aria-label={t("switchTo")} className="rounded-full px-2.5 py-1 uppercase hover:bg-currant/10">
            {l}
          </Link>
        ),
      )}
    </div>
  );
}
