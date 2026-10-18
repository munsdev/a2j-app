import { cn } from "@/lib/cn";

/** A pill-shaped switch between a few options (tabs, Page / Edit). */
export function Segmented<V extends string>({
  value,
  options,
  onChange,
  label,
  role = "group",
  idPrefix,
  className,
}: {
  value: V;
  options: readonly { value: V; label: string }[];
  onChange: (v: V) => void;
  label: string;
  /** "tablist" when it switches tab panels */
  role?: "group" | "tablist";
  /** with a tablist: tabs get ids `${idPrefix}-tab-${value}` and point at the panel `${idPrefix}-panel` */
  idPrefix?: string;
  className?: string;
}) {
  return (
    <div
      role={role}
      aria-label={label}
      onKeyDown={(e) => {
        /* a tablist moves with the arrow keys, Home and End (one tab stop for the whole list) */
        if (role !== "tablist") return;
        const i = options.findIndex((o) => o.value === value);
        const n = options.length;
        const keys: Record<string, number> = {
          ArrowRight: (i + 1) % n,
          ArrowLeft: (i - 1 + n) % n,
          Home: 0,
          End: n - 1,
        };
        const to = keys[e.key];
        if (to == null) return;
        e.preventDefault();
        onChange(options[to].value);
        (e.currentTarget.children[to] as HTMLElement | undefined)?.focus();
      }}
      className={cn(
        "inline-flex max-w-full [scrollbar-width:none] gap-0.5 self-start overflow-x-auto rounded-full bg-surface p-1 shadow-[inset_0_0_0_1px_var(--line)]",
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role={role === "tablist" ? "tab" : undefined}
            aria-selected={role === "tablist" ? on : undefined}
            id={role === "tablist" && idPrefix ? `${idPrefix}-tab-${o.value}` : undefined}
            aria-controls={role === "tablist" && idPrefix ? `${idPrefix}-panel` : undefined}
            tabIndex={role === "tablist" && !on ? -1 : undefined}
            aria-pressed={role === "group" ? on : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-[18px] py-2 font-extrabold whitespace-nowrap text-ink-2 transition-colors",
              on && "bg-ink text-canvas",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
