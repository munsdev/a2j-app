import { BRAND, SITE } from "@/i18n/common";
import { useT } from "@/i18n";

export function Footer() {
  const t = useT();
  return (
    <footer className="flex flex-wrap justify-center gap-x-[18px] gap-y-0 px-4 pt-2.5 pb-[calc(24px+env(safe-area-inset-bottom))] text-small text-ink-3 print:hidden">
      <span className="inline-flex min-h-11 items-center font-bold text-ink-2">
        {BRAND} · {SITE}
      </span>
      <a
        href="impressum.html"
        className="inline-flex min-h-11 items-center underline decoration-line-2 underline-offset-3 hover:text-ink hover:decoration-ink"
      >
        {t("imprint")}
      </a>
      <a
        href="datenschutz.html"
        className="inline-flex min-h-11 items-center underline decoration-line-2 underline-offset-3 hover:text-ink hover:decoration-ink"
      >
        {t("privacy")}
      </a>
      <a
        href="credits.html"
        className="inline-flex min-h-11 items-center underline decoration-line-2 underline-offset-3 hover:text-ink hover:decoration-ink"
      >
        {t("credits")}
      </a>
    </footer>
  );
}
