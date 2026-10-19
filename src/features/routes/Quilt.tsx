import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useDoc } from "@/data/store";
import { jobById } from "@/data/doc";
import { MAX_ROUTES, sortedRoutes } from "@/data/routes";
import { useEscoReady, useOnet } from "@/app/catalog";
import { go } from "@/app/router";
import { matchOf } from "@/domain/match";
import { jobTiles } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Hint, Icon, Lede, Page, RunHeader, ToggleChip } from "@/ui";
import { goRoute, openRouteSheet } from "./actions";
import { differs, quiltRows, routeWords } from "./model";
import { Patch, QuiltKey, RouteDisc, Score } from "./parts";
import { strings } from "./strings";

/* =================== COMPARE ROUTES: THE QUILT ===================
   Up to three routes side by side. Each column is a route (its job and its one course, the match today and
   with the course, when and what the course costs); each row a skill any of them needs, the square saying
   where it comes from on that route. "Only where they differ" hides the rows that read the same across. */

/** Rows shown before "Show all". */
const SHOWN = 24;

/** The height of the sticky top bar, so the routes' row can stick right under it (it is taller on phones). */
function useTopBarHeight(): number {
  const [h, setH] = useState(64);
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>("#root > header, header");
    if (!bar || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setH(bar.offsetHeight));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);
  return h;
}

export function Quilt() {
  const t = useT(strings);
  const d = useDoc();
  const E = useEscoReady();
  const O = useOnet();
  const [diff, setDiff] = useState(false);
  const [all, setAll] = useState(false);
  const top = useTopBarHeight();
  const cols = useMemo(
    () =>
      sortedRoutes(d).map((r) => {
        const w = routeWords(d, r);
        const job = jobById(d, r.job);
        const tiles = job ? jobTiles(d, E, job.occ, job, w.course) : [];
        const m = job && (job.occ ?? -1) >= 0 ? matchOf(d, E, O, job.occ!, job, w.course) : null;
        return { r, w, tiles, m, learn: tiles.filter((x) => x.state === "learn").length };
      }),
    [d, E, O],
  );
  const rows = useMemo(() => quiltRows(cols.map((c) => c.tiles)), [cols]);
  const picked = diff ? rows.filter(differs) : rows;
  /* a long quilt shows the first rows (the ones most routes need) until asked for all */
  const shown = all ? picked : picked.slice(0, SHOWN);
  const style = { "--n": cols.length } as CSSProperties;
  /* phones: each skill's name on its own full-width line above its squares; from sm a column of names */
  const grid =
    "grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-x-2.5 sm:grid-cols-[minmax(0,1.2fr)_repeat(var(--n),minmax(0,1fr))]";

  return (
    <Page width="wide">
      <RunHeader
        onBack={() => go("goals")}
        backLabel={t("nav_goals")}
        eyebrow={t("nav_goals")}
        title={t("q_title")}
      />
      <Lede>{t("q_p")}</Lede>
      {cols.length < 2 ? (
        <div className="flex flex-col items-start gap-3">
          <Hint>{t("q_need")}</Hint>
          {cols.length < MAX_ROUTES && (
            <Button variant="primary" onClick={() => openRouteSheet(null)}>
              <Icon name="plus" />
              {t("r_new")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <QuiltKey cells={["have", "also", "course", "learn", "none"]} />
            <ToggleChip pressed={diff} onClick={() => setDiff((v) => !v)}>
              {diff && <Icon name="check" />}
              {t("q_diff")}
            </ToggleChip>
          </div>
          <div
            role="table"
            aria-label={t("q_title")}
            className="flex flex-col rounded-panel bg-surface p-3 shadow-card sm:p-4"
            style={style}
          >
            <div
              role="row"
              className={cn(
                grid,
                "sticky z-10 -mx-3 mb-1 items-start border-b border-line bg-surface px-3 py-3 sm:-mx-4 sm:px-4",
              )}
              style={{ top }}
            >
              <span role="columnheader" className="max-sm:sr-only">
                <span className="sr-only">{t("q_skill")}</span>
              </span>
              {cols.map(({ r, w, m }) => {
                const here = r.id === d.route;
                return (
                  <div role="columnheader" key={r.id} className="flex min-w-0 flex-col items-start gap-1.5">
                    <span className="flex items-center gap-2">
                      <RouteDisc id={r.id} solid={here} />
                      {here && (
                        <span className="rounded-full bg-have-bg px-2 py-0.5 text-caption font-bold text-have-ink">
                          {t("r_here")}
                        </span>
                      )}
                    </span>
                    <b className="font-display text-label leading-tight font-semibold break-words hyphens-auto max-sm:text-small">
                      {w.job}
                    </b>
                    <span className="flex items-start gap-1 text-caption leading-snug break-words hyphens-auto text-course-ink [&_svg]:mt-0.5 [&_svg]:size-3.5 [&_svg]:flex-none">
                      {w.course ? (
                        <>
                          <Icon name="book" />
                          {w.course.name}
                        </>
                      ) : (
                        <span className="text-ink-3">{t("r_no_course")}</span>
                      )}
                    </span>
                    {m && <Score m={m} />}
                    {w.course && (
                      <span className="text-caption leading-snug text-ink-3 max-sm:hidden">
                        {[w.course.start, w.course.length, w.course.price].filter(Boolean).join(" · ")}
                        {w.course.azav === "provider" && (
                          <span className="block font-bold text-ink-2">{t("q_azav")}</span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {shown.map((row) => (
              <div
                role="row"
                key={row.key}
                className={cn(
                  grid,
                  "items-center border-b border-line/60 py-1.5 last:border-0 max-sm:gap-y-1",
                )}
              >
                <span
                  role="rowheader"
                  className="col-span-full text-small leading-tight font-bold break-words hyphens-auto sm:col-span-1"
                >
                  {row.name}
                </span>
                {row.cells.map((c, i) => (
                  <span role="cell" key={cols[i].r.id} className="flex px-0.5">
                    <Patch cell={c} />
                  </span>
                ))}
              </div>
            ))}
            {!shown.length && <Hint className="py-3">{t("q_same")}</Hint>}
            <div role="row" className={cn(grid, "mt-1 items-start border-t border-line pt-3")}>
              <span role="cell" className="max-sm:hidden" />
              {cols.map(({ r, learn }) => {
                const here = r.id === d.route;
                return (
                  <div role="cell" key={r.id} className="flex min-w-0 flex-col items-start gap-2">
                    <span className="text-caption text-ink-2">
                      {t("q_learn")}{" "}
                      <b className="font-display text-title leading-none font-extrabold text-ink">{learn}</b>
                    </span>
                    {here ? (
                      <span className="text-small font-bold text-have-ink">{t("r_here")}</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => goRoute(r.id)}
                        className="max-sm:px-3"
                      >
                        {t("r_switch")}
                        <span className="sr-only"> {t("r_route", { x: r.id })}</span>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openRouteSheet(r.id)} className="-ml-2">
                      <Icon name="edit" />
                      <span className="max-sm:sr-only">{t("r_edit_short")}</span>
                      <span className="sr-only"> {t("r_route", { x: r.id })}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          {picked.length > shown.length && (
            <Button size="sm" className="self-start" onClick={() => setAll(true)}>
              {t("q_more", { n: picked.length })}
            </Button>
          )}
        </>
      )}
    </Page>
  );
}
