import { useId, useRef } from "react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

/* How well someone can do a skill, 0 to 5, as one radio group: six options with the number and the words.
   Selected = the shared selected treatment (ink), never the "have" colour: choosing "0 Not at all" must not
   look like having the skill. Arrow keys move and select, as in any radio group. hint shows the line
   "From 1 on it counts as a skill you have" under it. */
export function LevelPicker({
  value,
  onChange,
  onPick,
  label,
  size = "md",
  hint,
  className,
}: {
  value: number | null;
  onChange: (n: number) => void;
  /** a level was clicked or tapped (not moved to with the arrow keys) */
  onPick?: (n: number) => void;
  label: string;
  size?: "md" | "sm";
  hint?: boolean;
  className?: string;
}) {
  const t = useT();
  const hintId = useId();
  const group = useRef<HTMLDivElement>(null);
  const pick = (n: number) => {
    onChange(n);
    (group.current?.children[n] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        ref={group}
        role="radiogroup"
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
        onKeyDown={(e) => {
          const cur = value ?? -1;
          const to =
            e.key === "ArrowRight" || e.key === "ArrowDown"
              ? Math.min(5, cur + 1)
              : e.key === "ArrowLeft" || e.key === "ArrowUp"
                ? Math.max(0, cur - 1)
                : null;
          if (to == null) return;
          e.preventDefault();
          pick(to);
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on || (value == null && n === 0) ? 0 : -1}
              onClick={() => {
                pick(n);
                onPick?.(n);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-option bg-surface px-1.5 py-2.5 text-center shadow-card transition-[box-shadow,background-color] hover:shadow-[var(--shadow-ring-strong),var(--shadow-card)]",
                size === "sm" ? "min-h-[58px]" : "min-h-[68px]",
                on && "bg-ink text-canvas shadow-none hover:shadow-none",
              )}
            >
              <b className="font-display text-[1.5rem] leading-none">{n}</b>
              <span className={cn("text-caption leading-tight font-bold", on ? "text-canvas" : "text-ink-2")}>
                {t(`lv${n}` as "lv0")}
              </span>
            </button>
          );
        })}
      </div>
      {hint && (
        <p id={hintId} className="text-small text-ink-3">
          {t("lv_hint")}
        </p>
      )}
    </div>
  );
}
