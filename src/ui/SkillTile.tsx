import type { ButtonHTMLAttributes } from "react";
import type { TileState } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/* A skill as a tile. Three states, told apart by shape as well as colour:
   have = apricot fill + check · course = blue tint + solid outline + book · learn = dashed outline. */
export function SkillTile({
  name,
  state,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { name: string; state: TileState }) {
  const t = useT();
  return (
    <button
      type="button"
      className={cn(
        "relative flex min-h-[58px] items-center rounded-[14px] py-2.5 pr-2.5 pl-[34px] text-left text-[0.84rem] leading-tight font-bold transition-transform active:scale-[.97]",
        state === "have" && "bg-have-bg text-have-ink",
        state === "course" && "bg-course-bg text-course-ink shadow-[inset_0_0_0_1.5px_var(--course)]",
        state === "learn" &&
          "bg-surface text-ink-2 shadow-[inset_0_0_0_1.5px_var(--line-2)] outline-[1.5px] -outline-offset-[5px] outline-learn outline-dashed",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-[9px] -mt-2.5 flex size-5 items-center justify-center rounded-full [&_svg]:size-3.5 [&_svg]:stroke-[2.6]",
          state === "have" && "bg-have text-on-accent",
          state === "course" && "bg-course text-white",
          state === "learn" && "shadow-[inset_0_0_0_2px_var(--line-2)]",
        )}
      >
        {state === "have" ? <Icon name="check" /> : state === "course" ? <Icon name="book" /> : null}
      </span>
      <span className="line-clamp-4 break-words hyphens-auto" title={name}>
        {name}
      </span>
      <span className="sr-only">
        {", "}
        {t(state === "have" ? "c_legend_have" : state === "course" ? "c_legend_course" : "c_legend_learn")}
      </span>
    </button>
  );
}

/** The legend for tile states. */
export function TileLegend({ className }: { className?: string }) {
  const t = useT();
  const sw = "inline-block size-3.5 rounded-[4px]";
  return (
    <div className={cn("flex flex-wrap gap-3 text-caption font-bold text-ink-2", className)}>
      <span className="inline-flex items-center gap-1.5">
        <i className={cn(sw, "bg-have")} />
        {t("c_legend_have")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className={cn(sw, "bg-course-bg shadow-[inset_0_0_0_2px_var(--course)]")} />
        {t("c_legend_course")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className={cn(sw, "outline-2 -outline-offset-2 outline-learn outline-dashed")} />
        {t("c_legend_learn")}
      </span>
    </div>
  );
}

/** Tiles in two to four columns. fit="container" sizes the columns to the box the grid sits in (inside cards
 *  and side columns), fit="screen" to the window. */
export function TileGrid({
  className,
  fit = "container",
  children,
}: {
  className?: string;
  fit?: "container" | "screen";
  children: React.ReactNode;
}) {
  if (fit === "screen")
    return (
      <div className={cn("grid grid-cols-2 gap-[7px] min-[560px]:grid-cols-3", className)}>{children}</div>
    );
  return (
    <div className="@container">
      <div className={cn("grid grid-cols-2 gap-[7px] @[30rem]:grid-cols-3 @[46rem]:grid-cols-4", className)}>
        {children}
      </div>
    </div>
  );
}
