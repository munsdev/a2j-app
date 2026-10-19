import type { Match } from "@/domain/match";
import type { Tile } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon } from "@/ui";
import { bar, cellKey, cellOf, type Cell, type Part, type QuiltCell } from "./model";
import { strings } from "./strings";

/* Small pieces every route screen shares: the letter, the score, a skill as a chip, a square of the quilt. */

/** The route's letter in a disc: ink when it is the route you are on (or `solid`), ringed otherwise. */
export function RouteDisc({
  id,
  solid,
  size = "md",
  className,
}: {
  id: string;
  solid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex flex-none items-center justify-center rounded-full font-display leading-none font-extrabold",
        size === "sm" && "size-6 text-[0.8rem]",
        size === "md" && "size-8 text-[0.95rem]",
        size === "lg" && "size-9 text-[1.1rem]",
        solid ? "bg-ink text-canvas" : "bg-surface text-ink shadow-[inset_0_0_0_2px_var(--ink)]",
        className,
      )}
    >
      {id}
    </span>
  );
}

/** The match today and with the course: "31 → 41", or one number when the course adds nothing. */
export function Score({ m, className }: { m: Match; className?: string }) {
  const t = useT(strings);
  const w = m.withCourses;
  return (
    <span className={cn("flex items-baseline gap-1 font-display tabular-nums", className)}>
      <span className="sr-only">
        {w != null ? t("r_score_sr", { a: m.score, b: w }) : t("r_score1_sr", { a: m.score })}
      </span>
      <span aria-hidden="true" className={cn("font-bold", w != null ? "text-ink-3" : "text-ink")}>
        {m.score}
      </span>
      {w != null && (
        <>
          <span aria-hidden="true" className="text-small text-ink-3">
            →
          </span>
          <b aria-hidden="true" className="text-title leading-none font-extrabold text-have-ink">
            {w}
          </b>
        </>
      )}
    </span>
  );
}

/** The look of each state, told apart by shape as well as colour: have a brick fill and a check; also the
 *  same with a blue ring around it; course a blue ring and a book; learn a dashed outline; none a dot. */
const LOOK: Record<Cell, string> = {
  have: "bg-have text-on-accent",
  also: "bg-have text-on-accent shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--course)]",
  course: "bg-surface text-course-ink shadow-[inset_0_0_0_2px_var(--course)]",
  learn: "bg-transparent text-ink-2 outline-2 -outline-offset-2 outline-learn outline-dashed",
  none: "bg-transparent text-ink-3",
};
const MARK = (c: Cell) =>
  c === "have" || c === "also" ? (
    <Icon name="check" />
  ) : c === "course" ? (
    <Icon name="book" />
  ) : c === "none" ? (
    <i className="size-1.5 rounded-full bg-line-2" />
  ) : null;

/** A square of the quilt (or a swatch of its key, with `small`). The words are for screen readers. */
export function Patch({ cell, small, className }: { cell: Cell; small?: boolean; className?: string }) {
  const t = useT(strings);
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-tile [&_svg]:stroke-[2.8]",
        small ? "h-5 w-8 flex-none [&_svg]:size-3" : "h-8 w-full [&_svg]:size-4",
        LOOK[cell],
        className,
      )}
    >
      <span aria-hidden="true" className="flex">
        {MARK(cell)}
      </span>
      {!small && <span className="sr-only">{t(cellKey(cell))}</span>}
    </span>
  );
}

/** A skill as a chip, in its state on the route. With onToggle it is a button that says whether the course
 *  covers it. */
export function SkillChip({ tile, onToggle }: { tile: Tile; onToggle?: () => void }) {
  const t = useT(strings);
  const c = cellOf(tile);
  const look = cn(
    "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-left text-small leading-tight font-bold [&_svg]:size-3.5 [&_svg]:flex-none [&_svg]:stroke-[2.8]",
    LOOK[c],
    c === "also" && "mx-1",
  );
  const body = (
    <>
      <span aria-hidden="true" className="flex">
        {MARK(c)}
      </span>
      <span className="min-w-0 break-words hyphens-auto">{tile.name}</span>
      <span className="sr-only">, {t(cellKey(c))}</span>
    </>
  );
  return (
    <li className={onToggle ? undefined : look}>
      {onToggle ? (
        <button
          type="button"
          aria-pressed={c === "course" || c === "also"}
          onClick={onToggle}
          className={cn(look, "transition-transform active:scale-[.97]")}
        >
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}

/** The key under a quilt or a preview. */
export function QuiltKey({ cells, className }: { cells: readonly Cell[]; className?: string }) {
  const t = useT(strings);
  return (
    <ul
      aria-hidden="true"
      className={cn("flex flex-wrap gap-x-4 gap-y-2 text-caption text-ink-2", className)}
    >
      {cells.map((c) => (
        <li key={c} className="flex items-center gap-2">
          <Patch cell={c} small />
          {t(cellKey(c))}
        </li>
      ))}
    </ul>
  );
}

const PART: Record<Part, string> = {
  have: "bg-have",
  course: "bg-course",
  learn: "border-[1.5px] border-dashed border-learn",
  room: "bg-sunk",
};

/** A square of the quilt as five parts, like the skill ratings: your level in brick, what the course adds in
 *  blue, the rest dashed (to learn) or plain (room to grow). A dot when the job does not need it. The words
 *  are for screen readers. */
export function Bar({ cell, className }: { cell: QuiltCell; className?: string }) {
  const t = useT(strings);
  const sr =
    cell.c === "none"
      ? t("q_k_none")
      : [
          cell.level ? t("q_you", { n: cell.level }) : t("q_k_learn"),
          cell.c === "course" || cell.c === "also" ? t("q_k_course") : "",
        ]
          .filter(Boolean)
          .join(", ");
  return (
    <span className={cn("flex h-8 w-full items-center", className)}>
      {cell.c === "none" ? (
        <i aria-hidden="true" className="mx-auto size-1.5 rounded-full bg-line-2" />
      ) : (
        <span aria-hidden="true" className="flex h-6 w-full gap-[3px]">
          {bar(cell).map((p, i) => (
            <span key={i} className={cn("flex-1 rounded-[3px]", PART[p])} />
          ))}
        </span>
      )}
      <span className="sr-only">{sr}</span>
    </span>
  );
}

/** The key under the quilt: the parts of a bar. */
export function BarKey({ className }: { className?: string }) {
  const t = useT(strings);
  const items: [Part | "none", string][] = [
    ["have", t("q_b_have")],
    ["course", t("q_b_course")],
    ["learn", t("q_k_learn")],
    ["none", t("q_k_none")],
  ];
  return (
    <ul
      aria-hidden="true"
      className={cn("flex flex-wrap gap-x-4 gap-y-2 text-caption text-ink-2", className)}
    >
      {items.map(([p, label]) => (
        <li key={p} className="flex items-center gap-2">
          {p === "none" ? (
            <i className="mx-1.5 size-1.5 rounded-full bg-line-2" />
          ) : (
            <span className={cn("h-4 w-3 rounded-[3px]", PART[p])} />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}
