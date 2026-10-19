import { useId, useMemo } from "react";
import { mainGoal } from "@/data/doc";
import { courseForJob, currentRoute, isDirect } from "@/data/routes";
import { openFinder, openItem } from "@/features/courses/api";
import { strings as routeStrings } from "@/features/routes/strings";
import { LinkButton } from "@/ui";
import { useDoc } from "@/data/store";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { go } from "@/app/router";
import { jobCount } from "@/domain/skills";
import { useT } from "@/i18n";
import { Button, Eyebrow, Hint, Icon } from "@/ui";
import { Board, BoardSkeleton, EmptyBoard } from "./Board";
import { Title } from "./Title";
import { strings } from "./strings";

/* CONTRACT (owned by the Goals build). Used by the Goals overview.
   <BoardCard actions={false} />: the main goal's line ("Your line to …") or, without a goal, the
   "Pick a job to aim for" card. Props: actions (default true) shows See this job (the line itself carries
   the next step, "Find a course" among them). The line fits itself to the box it is in. It needs the
   catalogue for the stops: outside <NeedCatalog> it shows the goal's title (it is in the document) over a
   skeleton of the count and the line, so nothing jumps when they come. */
export function BoardCard({ actions = true }: { actions?: boolean }) {
  const t = useT(strings);
  const headId = useId();
  const E = useEsco();
  const d = useDoc();
  const g = mainGoal(d);
  const custom = !!g && (g.occ ?? -1) < 0 && !(g.extra ?? []).length;
  const c = useMemo(() => (g && (E || custom) ? jobCount(d, E, g.occ, g) : null), [d, E, g, custom]);
  useLoadCatalog(!!g); // outside <NeedCatalog>: fetch it for the stops
  const tr = useT(routeStrings);
  const route = currentRoute(d);
  const rc = g ? courseForJob(d, g.id) : null;
  const shell = "flex flex-col gap-4 rounded-panel bg-surface p-[18px] shadow-card sm:px-6 sm:pb-6";
  if (!g) {
    return (
      <section className={shell}>
        <EmptyBoard />
      </section>
    );
  }
  return (
    <section className={shell} aria-labelledby={headId} aria-busy={!c || undefined}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Eyebrow>{route ? `${tr("r_route", { x: route.id })} · ${t("g_way")}` : t("g_way")}</Eyebrow>
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
          {/* the route's one course, or a way to find it */}
          {rc ? (
            <LinkButton
              className="min-h-11 gap-1.5 self-start text-small text-course-ink [&_svg]:size-4"
              onClick={() => openItem("course", rc.id, g.id)}
            >
              <Icon name="book" />
              {rc.name}
            </LinkButton>
          ) : isDirect(route) ? (
            <span className="flex min-h-11 items-center text-small text-ink-3">{tr("r_direct")}</span>
          ) : (
            <LinkButton className="min-h-11 self-start text-small" onClick={() => openFinder("course", g.id)}>
              {tr("r_no_course")} · {tr("r_find")}
            </LinkButton>
          )}
        </div>
        {c ? (
          c.total > 0 && (
            <p className="flex-none font-display font-bold whitespace-nowrap text-ink-2 tabular-nums">
              <span className="sr-only">{t("c_skills", { h: c.have, t: c.total })}</span>
              <span aria-hidden="true">
                {t("b_stop")} <b className="text-display leading-none font-extrabold text-ink">{c.have}</b>
                <span className="text-title"> / {c.total}</span>
              </span>
            </p>
          )
        ) : (
          <span className="mb-1 h-8 w-20 flex-none animate-pulse rounded-tile bg-sunk" aria-hidden="true" />
        )}
      </div>
      {c ? <Board job={g} /> : <BoardSkeleton />}
      {c && c.total > 0 && <Hint>{t("b_tap")}</Hint>}
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
