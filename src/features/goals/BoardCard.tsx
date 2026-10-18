import { useId, useMemo } from "react";
import { mainGoal } from "@/data/doc";
import { useDoc } from "@/data/store";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { go } from "@/app/router";
import { jobCount } from "@/domain/skills";
import { useT } from "@/i18n";
import { Button, Eyebrow, Hint, Icon } from "@/ui";
import { Board, EmptyBoard } from "./Board";
import { Title } from "./Title";
import { strings } from "./strings";

/* CONTRACT (owned by the Goals build). Used by Home.
   <BoardCard actions={false} />: the main goal's board ("Your way to …") or, without a goal, the
   "Pick a job to aim for" card. Props: actions (default true) shows See this job (the board itself carries
   the next step, "Find a course" among them). The board fits itself to the box it is in. It needs the
   catalogue for the path: outside <NeedCatalog> it shows the goal's title (it is in the document) over a
   skeleton of the count and the path, so nothing jumps when they come. */
export function BoardCard({ actions = true }: { actions?: boolean }) {
  const t = useT(strings);
  const headId = useId();
  const E = useEsco();
  const d = useDoc();
  const g = mainGoal(d);
  const c = useMemo(() => (g && E ? jobCount(d, E, g.occ, g) : null), [d, E, g]);
  useLoadCatalog(!!g); // on Home, outside <NeedCatalog>: fetch it for the squares
  const shell = "flex flex-col gap-4 rounded-panel bg-surface p-[18px] shadow-card sm:px-6 sm:pb-6";
  if (!g) {
    return (
      <section className={shell}>
        <EmptyBoard />
      </section>
    );
  }
  const custom = (g.occ ?? -1) < 0 && !(g.extra ?? []).length;
  return (
    <section className={shell} aria-labelledby={headId} aria-busy={!c || undefined}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Eyebrow>{t("g_way")}</Eyebrow>
          <h2 id={headId} className="text-heading">
            <a
              href={"#goals/job/" + g.id}
              className="underline decoration-line-2 decoration-2 underline-offset-4 transition-colors hover:decoration-ink"
              onClick={(e) => {
                e.preventDefault();
                go("goals/job/" + g.id);
              }}
            >
              <Title text={g.title} split />
            </a>
          </h2>
        </div>
        {c ? (
          <p className="font-display font-semibold whitespace-nowrap tabular-nums">
            <b className="text-display leading-none text-have-ink">{c.have}</b>
            <span className="text-title text-ink-3"> / {c.total}</span>
          </p>
        ) : (
          <span className="mb-1 h-8 w-16 flex-none animate-pulse rounded-tile bg-sunk" aria-hidden="true" />
        )}
      </div>
      {c
        ? !custom && <Board job={g} />
        : /* the catalogue is still loading (Home): the path's place, so the page does not jump */
          !custom && <span className="min-h-64 animate-pulse rounded-card bg-sunk" aria-hidden="true" />}
      {!custom && <Hint>{t("b_tap")}</Hint>}
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button size="sm" onClick={() => go("goals/job/" + g.id)}>
            {t("b_open")}
            <Icon name="arrow" />
          </Button>
        </div>
      )}
    </section>
  );
}
