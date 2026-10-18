import type { Lang } from "@/data/types";
import { useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";

/** EN / DE. Each button is 44px tall to the finger (the pill itself is drawn smaller). */
export function LangSwitch({ onChange }: { onChange: (l: Lang) => void }) {
  const t = useT();
  const lang = useLang();
  return (
    <div role="group" aria-label={t("lang_aria")} className="flex">
      {(["en", "de"] as const).map((l, i) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className="group flex min-h-11 min-w-10 items-center justify-center"
        >
          <span
            className={cn(
              "bg-surface px-2.5 py-1.5 text-[0.8rem] font-extrabold text-ink-3 uppercase shadow-ring-soft transition-colors group-hover:text-ink",
              i === 0 ? "rounded-l-full pl-3" : "rounded-r-full pr-3",
              lang === l && "bg-ink text-canvas shadow-none group-hover:text-canvas",
            )}
          >
            {l}
          </span>
        </button>
      ))}
    </div>
  );
}
