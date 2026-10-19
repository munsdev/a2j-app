import { createElement } from "react";
import type { RouteId, SkillRef } from "@/data/types";
import { getDoc, update } from "@/data/store";
import { jobById } from "@/data/doc";
import {
  MAX_ROUTES,
  addRoute,
  firstCourseFor,
  removeRoute,
  routeById,
  setRoute,
  switchRoute,
} from "@/data/routes";
import { skKey } from "@/domain/skills";
import { closeSheet, openSheet } from "@/app/sheet";
import { toast, toastUndo } from "@/app/toast";
import { useSettings } from "@/app/settings";
import { makeT } from "@/i18n";
import { strings } from "./strings";
import { ReplaceSheet, RouteList, RouteSheet } from "./sheets";

/* What the route bar, the sheets, the board and the job page do with routes. Each is one undo step. */

const t = () => makeT(useSettings.getState().lang, strings);

/** Go onto a route: Home, Goals and the plan follow it. */
export function goRoute(id: RouteId): void {
  if (getDoc().route === id) return;
  update((d) => switchRoute(d, id));
  toast(t()("r_switched", { x: id }));
}

/** Start a route to a job (with a course, or the best one saved for it) and go onto it. With three routes
 *  already, ask which one it replaces. */
export function startRoute(jobId: string, course?: string | null): void {
  const d = getDoc();
  const job = jobById(d, jobId);
  if (!job) return;
  const same = d.routes.find((r) => r.job === jobId && (course === undefined || r.course === course));
  if (same) return goRoute(same.id);
  if (d.routes.length >= MAX_ROUTES) {
    openSheet(createElement(ReplaceSheet, { jobId, course }), { label: t()("r_replace_h") });
    return;
  }
  let id: RouteId | null = null;
  update((dr) => {
    id = addRoute(dr, jobId, course);
    if (id) switchRoute(dr, id);
  });
  if (id) toast(t()("r_started", { x: id, job: job.title }));
}

/** Put a job (and course) in the place of a route, and go onto it. */
export function replaceRoute(id: RouteId, jobId: string, course?: string | null): void {
  const job = jobById(getDoc(), jobId);
  if (!job) return;
  update((d) => {
    const c = course === undefined ? firstCourseFor(d, jobId) : course;
    if (setRoute(d, id, jobId, c)) switchRoute(d, id);
  });
  closeSheet();
  toast(t()("r_started", { x: id, job: job.title }));
}

/** Save a route from the route sheet: a new one (and go onto it) or a changed one. Returns false when the same
 *  route exists already. */
export function saveRoute(id: RouteId | null, jobId: string, course: string | null): boolean {
  const d = getDoc();
  const dup = d.routes.find((r) => r.id !== id && r.job === jobId && r.course === course);
  if (dup) {
    toast(t()("r_dup", { x: dup.id }), { bad: true });
    return false;
  }
  let saved: RouteId | null = id;
  update((dr) => {
    if (id) setRoute(dr, id, jobId, course);
    else {
      saved = addRoute(dr, jobId, course);
      if (saved) switchRoute(dr, saved);
    }
  });
  closeSheet();
  if (saved)
    toast(t()(id ? "r_saved" : "r_started", { x: saved, job: jobById(getDoc(), jobId)?.title ?? "" }));
  return true;
}

export function removeRouteWithUndo(id: RouteId): void {
  update((d) => removeRoute(d, id));
  closeSheet();
  toastUndo(t()("r_removed", { x: id }));
}

/** Use a course on the route to a job (the one you are on when it goes there). */
export function putCourseOn(id: RouteId, course: string): void {
  const r = routeById(getDoc(), id);
  if (!r) return;
  saveRoute(id, r.job, course);
}

/** The route's course teaches this skill after all: tick it as covered. */
export function coversThis(courseId: string, x: SkillRef, name: string): void {
  const c = getDoc().courses.find((y) => y.id === courseId);
  if (!c) return;
  update((d) => {
    const y = d.courses.find((z) => z.id === courseId);
    if (y && !y.covers.some((v) => skKey(v) === skKey(x))) y.covers.push(x);
  });
  toast(t()("r_covers_added", { c: c.name, x: name }));
}

/** Say whether a course covers a skill (the quilt, the route sheet, the skill sheet): on, or off again. */
export function toggleCovers(courseId: string, x: SkillRef, name: string): void {
  const c = getDoc().courses.find((y) => y.id === courseId);
  if (!c) return;
  const on = c.covers.some((v) => skKey(v) === skKey(x));
  update((d) => {
    const y = d.courses.find((z) => z.id === courseId);
    if (!y) return;
    y.covers = on ? y.covers.filter((v) => skKey(v) !== skKey(x)) : [...y.covers, x];
  });
  toast(t()(on ? "q_covers_off" : "q_covers_on", { c: c.name, x: name }));
}

export const openRouteList = (): void => openSheet(createElement(RouteList), { label: t()("r_list_h") });
export const openRouteSheet = (id: RouteId | null, jobId?: string | null): void =>
  openSheet(createElement(RouteSheet, { id, jobId: jobId ?? null, key: (id ?? "new") + (jobId ?? "") }), {
    label: id ? t()("r_edit", { x: id }) : t()("r_new"),
  });
