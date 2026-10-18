import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Job } from "@/data/types";
import { jobById, jobsIn } from "@/data/doc";
import { useDoc } from "@/data/store";
import { useEscoReady, useOnet } from "@/app/catalog";
import { matchOf } from "@/domain/match";
import { go } from "@/app/router";
import { jobCount, type TileState } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Chips, Hint, Icon, Lede, Page, RunHeader, Tag, TileLegend, ToggleChip } from "@/ui";
import { makeGoalAndOpen } from "./actions";
import { FitBadge } from "./Fit";
import { compareRows, pickDroppingOldest } from "./layout";
import { useGoals } from "./store";
import { Title } from "./Title";
import { strings } from "./strings";

/* =================== COMPARE ===================
   Up to three goals or shortlisted jobs side by side, as a quilt: one row per skill these jobs need, shared
   skills first. A fourth pick pushes out the oldest. */

const SHOWN = 24;
/* the kit's words for the tile states, as in the legend */
const STATE_KEY = { have: "c_legend_have", course: "c_legend_course", learn: "c_legend_learn" } as const;

/** The height of the sticky top bar, so the jobs' row can stick right under it (it is taller on phones). */
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

export function Compare() {
  const t = useT(strings);
  const d = useDoc();
  const E = useEscoReady();
  const O = useOnet();
  const cmp = useGoals((s) => s.cmp);
  const all = useGoals((s) => s.cmpAll);
  const pool = useMemo(
    () =>
      jobsIn(d, "goal")
        .concat(jobsIn(d, "maybe"))
        .filter((j) => (j.occ ?? -1) >= 0),
    [d],
  );
  /* nothing picked yet: the first three */
  const picks = useMemo(
    () => (cmp ?? pool.slice(0, 3).map((j) => j.id)).filter((id) => pool.some((j) => j.id === id)),
    [cmp, pool],
  );
  const data = useMemo(() => {
    const sel = picks.map((id) => jobById(d, id)).filter((j): j is Job => !!j);
    const counts = sel.map((j) => jobCount(d, E, j.occ, j));
    const matches = sel.map((j) => matchOf(d, E, O, j.occ!, j));
    return { sel, matches, rows: sel.length < 2 ? [] : compareRows(counts.map((c) => c.tiles)) };
  }, [d, E, O, picks]);
  const { sel } = data;
  const shown = all ? data.rows : data.rows.slice(0, SHOWN);
  const top = useTopBarHeight();
  const cols = { "--n": sel.length } as CSSProperties;
  /* phones: each skill's name on its own full-width line above its cells; from sm a column of names */
  const grid =
    "grid grid-cols-[repeat(var(--n),minmax(0,1fr))] items-center gap-1.5 sm:grid-cols-[minmax(0,1.3fr)_repeat(var(--n),minmax(0,1fr))]";

  return (
    <Page width="medium">
      <RunHeader
        onBack={() => go("goals")}
        backLabel={t("nav_goals")}
        eyebrow={t("nav_goals")}
        title={t("cmp_title")}
      />
      <Lede>{t("cmp_p")}</Lede>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-extrabold">{t("cmp_pick")}</legend>
        <Chips>
          {pool.map((j) => (
            <ToggleChip
              key={j.id}
              pressed={picks.includes(j.id)}
              onClick={() => useGoals.setState({ cmp: pickDroppingOldest(picks, j.id) })}
            >
              {j.role === "goal" && <Icon name="flag" />}
              {j.title}
            </ToggleChip>
          ))}
        </Chips>
      </fieldset>
      {sel.length < 2 ? (
        <Hint>{t("cmp_need")}</Hint>
      ) : (
        <>
          <TileLegend />
          <div
            role="table"
            aria-label={t("cmp_title")}
            className="flex flex-col rounded-panel bg-surface p-3 shadow-card sm:p-4"
            style={cols}
          >
            <div
              role="row"
              className={cn(
                grid,
                "sticky z-10 -mx-3 mb-1 items-start border-b border-line bg-surface px-3 py-3 sm:-mx-4 sm:px-4",
              )}
              style={{ top }}
            >
              {/* from sm it keeps its grid column (only the words are hidden); on phones it takes none */}
              <span role="columnheader" className="row-span-4 max-sm:sr-only">
                <span className="sr-only">{t("sk_skill")}</span>
              </span>
              {sel.map((j, ci) => {
                const m = data.matches[ci];
                return (
                  <div
                    role="columnheader"
                    key={j.id}
                    /* a subgrid: titles, scores and buttons each line up across the jobs */
                    className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center gap-1.5 text-center"
                  >
                    <a
                      href={"#goals/job/" + j.id}
                      onClick={(e) => {
                        e.preventDefault();
                        go("goals/job/" + j.id);
                      }}
                      className="font-display text-label font-semibold break-words hyphens-auto text-ink no-underline hover:underline max-sm:text-caption"
                    >
                      <Title text={j.title} split subClassName="text-caption font-semibold" />
                    </a>
                    <FitBadge score={m.score} />
                    <span className="text-caption leading-snug font-bold text-ink-3">
                      <span className="sr-only">{t("m_sr", { n: m.score })} </span>
                      <span className="block text-ink-2">{t(`m${m.band}`)}</span>
                      <span className="max-sm:sr-only">
                        {[
                          m.interest != null ? `${t("m_int")} ${m.interest}` : null,
                          `${t("m_sk")} ${m.skills}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {j.role === "goal" ? (
                      <Tag tone="goal">
                        <Icon name="flag" />
                        {t("g_goal")}
                      </Tag>
                    ) : (
                      /* phones: a flag button; its label names the job */
                      <Button
                        size="sm"
                        aria-label={`${t("cmp_make")}: ${j.title}`}
                        className="whitespace-normal max-sm:size-10 max-sm:px-0"
                        onClick={() => makeGoalAndOpen(j.id)}
                      >
                        <Icon name="flag" />
                        <span className="max-sm:hidden">{t("cmp_make")}</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {shown.map((r) => (
              <div role="row" key={r.tile.key} className={cn(grid, "py-1 max-sm:gap-y-1 max-sm:py-1.5")}>
                <span
                  role="rowheader"
                  className="col-span-full text-small leading-tight font-bold break-words hyphens-auto sm:col-span-1"
                >
                  {r.tile.name}
                </span>
                {sel.map((j, ci) =>
                  r.cols.includes(ci) ? (
                    <Cell key={j.id} state={r.tile.state} label={t(STATE_KEY[r.tile.state])} />
                  ) : (
                    <span key={j.id} role="cell" className="flex h-9 items-center justify-center">
                      <i className="size-1.5 rounded-full bg-line-2" aria-hidden="true" />
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
          {data.rows.length > shown.length && (
            <Button size="sm" className="self-start" onClick={() => useGoals.setState({ cmpAll: true })}>
              {t("cmp_more", { n: data.rows.length })}
            </Button>
          )}
        </>
      )}
    </Page>
  );
}

function Cell({ state, label }: { state: TileState; label: string }) {
  return (
    <span
      role="cell"
      title={label}
      className={cn(
        "flex h-9 items-center justify-center rounded-tile [&_svg]:size-4 [&_svg]:stroke-[2.6]",
        state === "have" && "bg-have text-on-accent",
        // the course ring, as on the kit's tiles
        state === "course" && "bg-course-bg text-course-ink shadow-[inset_0_0_0_1.5px_var(--course)]",
        state === "learn" && "outline-[1.5px] -outline-offset-4 outline-learn outline-dashed",
      )}
    >
      {state === "have" ? <Icon name="check" /> : state === "course" ? <Icon name="book" /> : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}
