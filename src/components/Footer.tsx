import { useTranslations } from "next-intl";
import Logo from "./Logo";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="bg-currant text-frost">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <Logo className="text-[28px]" />
          <p className="mt-2 text-sm text-frost/70">{t("place")}</p>
        </div>
        <p className="max-w-[46ch] text-sm leading-relaxed text-frost/75 md:text-right">{t("concept")}</p>
      </div>
    </footer>
  );
}
