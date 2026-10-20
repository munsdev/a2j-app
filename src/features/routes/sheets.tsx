import { useMemo, useState } from "react";
import type { RouteId } from "@/data/types";
import { useDoc } from "@/data/store";
import { jobById } from "@/data/doc";
import { DIRECT, MAX_ROUTES, firstCourseFor, routeById, sortedRoutes } from "@/data/routes";
import { useEsco, useLoadCatalog, useOnet } from "@/app/catalog";
import { go } from "@/app/router";
import { closeSheet } from "@/app/sheet";
import { matchOf } from "@/domain/match";
import { jobTiles, skKey } from "@/domain/skills";
import { openFinder } from "@/features/courses/api";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Choice, Field, Hint, Icon, RowButton, Select, SheetHead } from "@/ui";
import {
  goRoute,
  openRouteSheet,
  removeRouteWithUndo,
  replaceRoute,
  saveRoute,
  toggleCovers,
} from "./actions";
import { QuiltKey, RouteDisc, Score, SkillChip } from "./parts";
import { routeWords } from "./model";
import { strings } from "./strings";

/* The sheets: your routes (switch, edit, new, compare), one route (its job and its course, with what it
   gives you), and "replace a route?" when all three are taken. */

/** Your routes: tap one to go onto it. */
export function RouteList() {
  const t = useT(strings);
  const d = useDoc();
  const E = useEsco();
  const O = useOnet();
  useLoadCatalog(true);
  const routes = sortedRoutes(d);
  const full = routes.length >= MAX_ROUTES;
  return (
    <>
      <SheetHead title={t("r_list_h")} sub={t("r_list_p")} />
      <ul className="flex flex-col gap-2">
        {routes.map((r) => {
          const w = routeWords(d, r);
          const job = jobById(d, r.job);
          const here = r.id === d.route;
          const m = E && job && (job.occ ?? -1) >= 0 ? matchOf(d, E, O, job.occ!, job, w.course) : null;
          return (
            <li key={r.id} className="flex items-stretch gap-1.5">
              <RowButton
                aria-current={here || undefined}
                lead={<RouteDisc id={r.id} solid={here} />}
                title={w.job}
                detail={w.course?.name ?? t(w.direct ? "r_direct" : "r_no_course")}
                chevron={false}
                className={cn("flex-1", here && "shadow-[inset_0_0_0_2px_var(--ink)]")}
                onClick={() => {
                  closeSheet();
                  goRoute(r.id);
                }}
              >
                {here && <span className="text-caption font-bold text-ink-2">{t("r_here")}</span>}
                {m && <Score m={m} className="text-small" />}
              </RowButton>
              <Button
                variant="ghost"
                className="h-auto px-3"
                aria-label={t("r_edit", { x: r.id })}
                onClick={() => openRouteSheet(r.id)}
              >
                <Icon name="edit" />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={full} onClick={() => openRouteSheet(null)}>
          <Icon name="plus" />
          {t("r_new")}
        </Button>
        {routes.length >= 2 && (
          <Button onClick={() => go("goals/compare")}>
            <Icon name="grid" />
            {t("r_compare")}
          </Button>
        )}
      </div>
      {full && <Hint>{t("r_full")}</Hint>}
    </>
  );
}

/** One route: pick its job and its one course, see what it gives you, save. id null: a new route. */
export function RouteSheet({ id, jobId }: { id: RouteId | null; jobId: string | null }) {
  const t = useT(strings);
  const d = useDoc();
  const E = useEsco();
  const O = useOnet();
  useLoadCatalog(true);
  const r = routeById(d, id);
  const letter: RouteId | null =
    id ?? (d.routes.length < MAX_ROUTES ? nextLetter(d.routes.map((x) => x.id)) : null);
  const jobs = useMemo(
    () =>
      d.jobs
        .filter((j) => (j.role === "goal" || j.role === "maybe") && j.title.trim())
        .sort((a, b) => (a.role === "goal" ? 0 : 1) - (b.role === "goal" ? 0 : 1)),
    [d.jobs],
  );
  const [job, setJob] = useState<string>(() => r?.job ?? jobId ?? jobs[0]?.id ?? "");
  const [course, setCourse] = useState<string | null>(() =>
    r ? r.course : job ? firstCourseFor(d, job) : null,
  );
  const j = jobById(d, job);
  const c = course ? (d.courses.find((x) => x.id === course) ?? null) : null;
  const tiles = useMemo(() => (j && E ? jobTiles(d, E, j.occ, j, c) : []), [d, E, j, c]);
  const keys = useMemo(() => new Set(tiles.map((x) => x.key)), [tiles]);
  const courses = useMemo(() => {
    const mine = d.courses.filter((x) => x.goals.includes(job));
    return mine.concat(d.courses.filter((x) => !x.goals.includes(job)));
  }, [d.courses, job]);
  const m = E && j && (j.occ ?? -1) >= 0 ? matchOf(d, E, O, j.occ!, j, c) : null;
  if (!letter) return null;

  return (
    <>
      <SheetHead
        eyebrow={
          <span className="flex items-center gap-2">
            <RouteDisc id={letter} size="sm" solid />
            {t("r_route", { x: letter })}
          </span>
        }
        title={id ? t("r_edit", { x: letter }) : t("r_new")}
      />
      {!jobs.length ? (
        <Hint>{t("r_job_none")}</Hint>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (job) saveRoute(id, job, course);
          }}
        >
          <Field label={t("r_job")}>
            {(p) => (
              <Select
                id={p.id}
                value={job}
                onChange={(e) => {
                  setJob(e.target.value);
                  setCourse(firstCourseFor(d, e.target.value, []));
                }}
              >
                {jobs.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-label font-extrabold">{t("r_course")}</legend>
            <Hint className="-mt-1 mb-1">{t("r_course_p")}</Hint>
            {courses.map((x) => {
              const n = x.covers.filter((v) => keys.has(skKey(v))).length;
              return (
                <Choice
                  key={x.id}
                  name="route-course"
                  checked={course === x.id}
                  onChange={() => setCourse(x.id)}
                  label={
                    <span className="flex flex-col gap-0.5">
                      <span className="break-words">{x.name}</span>
                      <span className="text-small font-normal text-ink-3">
                        {[x.start, x.length, x.price].filter(Boolean).join(" · ")}
                      </span>
                      {E && (
                        <span
                          className={cn(
                            "self-start rounded-full px-2 py-0.5 text-caption font-bold",
                            n ? "bg-course-bg text-course-ink" : "bg-sunk text-ink-2",
                          )}
                        >
                          {t("r_covers_n", { n })}
                        </span>
                      )}
                    </span>
                  }
                />
              );
            })}
            <Choice
              name="route-course"
              checked={course === DIRECT}
              onChange={() => setCourse(DIRECT)}
              label={
                <span className="flex flex-col gap-0.5">
                  <span>{t("r_direct")}</span>
                  <span className="text-small font-normal text-ink-3">{t("r_direct_p")}</span>
                </span>
              }
            />
            <Choice
              name="route-course"
              checked={course === null}
              onChange={() => setCourse(null)}
              label={t("r_course_none")}
            />
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => job && openFinder("course", job)}
            >
              <Icon name="search" />
              {t("r_find")}
            </Button>
          </fieldset>
          {tiles.length > 0 && (
            <section
              className="flex flex-col gap-3 rounded-option bg-surface-2 p-4"
              aria-labelledby="route-gives"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id="route-gives" className="text-label font-extrabold">
                  {t("r_gives")}
                </h3>
                {m && <Score m={m} />}
              </div>
              <ul className="flex flex-wrap gap-2">
                {tiles.map((x) => (
                  <SkillChip
                    key={x.key}
                    tile={x}
                    onToggle={c ? () => toggleCovers(c.id, x.x, x.name) : undefined}
                  />
                ))}
              </ul>
              <QuiltKey cells={["have", "also", "some", "course", "learn"]} />
              <Hint>{t("r_gives_p")}</Hint>
              {c && <Hint>{t("r_tap")}</Hint>}
            </section>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="submit" variant="primary" disabled={!job}>
              {t("r_save", { x: letter })}
            </Button>
            {id && (
              <Button variant="danger-ghost" onClick={() => removeRouteWithUndo(id)}>
                <Icon name="trash" />
                {t("r_remove", { x: id })}
              </Button>
            )}
          </div>
        </form>
      )}
    </>
  );
}

const nextLetter = (taken: readonly string[]): RouteId =>
  (["A", "B", "C"] as const).find((x) => !taken.includes(x)) ?? "C";

/** All three routes are taken: which one does the new job (and course) replace? */
export function ReplaceSheet({ jobId, course }: { jobId: string; course?: string | null }) {
  const t = useT(strings);
  const d = useDoc();
  const job = jobById(d, jobId);
  if (!job) return null;
  return (
    <>
      <SheetHead title={t("r_replace_h")} sub={t("r_replace_p", { job: job.title })} />
      <ul className="flex flex-col gap-2">
        {sortedRoutes(d).map((r) => {
          const w = routeWords(d, r);
          return (
            <li key={r.id}>
              <RowButton
                lead={<RouteDisc id={r.id} solid={r.id === d.route} />}
                title={t("r_replace", { x: r.id })}
                detail={[w.job, w.course?.name ?? t("r_no_course")].join(" · ")}
                onClick={() => replaceRoute(r.id, jobId, course)}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
