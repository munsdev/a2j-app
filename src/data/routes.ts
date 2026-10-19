import type { Course, Doc, Job, Route, RouteId } from "./types";
import { ROUTE_IDS } from "./types";

/* =================== ROUTES ===================
   A route is one job and the one course that gets you there, or no course at all when the person can apply
   straight away (DIRECT). A person keeps up to three (A, B, C) and is
   always on one of them: Home, the Goals board and the plan follow it until they switch. The profile is the
   same on every route.
   A job is a goal exactly when a route uses it: fixRoutes keeps the two in step after every change, so the
   rest of the app can keep asking for goals and the main goal. Pure; the changing helpers take a draft. */

export const MAX_ROUTES = ROUTE_IDS.length;

/** Stored as a route's course when it needs none: the person applies for the job directly. Older app
 *  versions find no course with this id and show "no course yet". */
export const DIRECT = "direct";
export const isDirect = (r: Route | null | undefined): boolean => r?.course === DIRECT;

export const routeById = (d: Doc, id: string | null | undefined): Route | null =>
  (id && d.routes.find((r) => r.id === id)) || null;

/** The route the person is on. */
export const currentRoute = (d: Doc): Route | null => routeById(d, d.route) ?? d.routes[0] ?? null;

export const routeCourse = (d: Doc, r: Route | null | undefined): Course | null =>
  (r?.course && d.courses.find((c) => c.id === r.course)) || null;

export const routeJob = (d: Doc, r: Route | null | undefined): Job | null =>
  (r && d.jobs.find((j) => j.id === r.job)) || null;

/** The route a job is seen through: the one you are on when it goes to this job, else its first route. */
export function routeForJob(d: Doc, jobId: string | null | undefined): Route | null {
  if (!jobId) return null;
  const cur = currentRoute(d);
  return cur?.job === jobId ? cur : (d.routes.find((r) => r.job === jobId) ?? null);
}

/** The course that counts for a job: the course of its route. Courses saved for other routes do not. */
export const courseForJob = (d: Doc, jobId: string | null | undefined): Course | null =>
  routeCourse(d, routeForJob(d, jobId));

/** Routes in letter order. */
export const sortedRoutes = (d: Doc): Route[] =>
  [...d.routes].sort((a, b) => ROUTE_IDS.indexOf(a.id) - ROUTE_IDS.indexOf(b.id));

export const freeRouteId = (d: Doc): RouteId | null =>
  ROUTE_IDS.find((id) => !d.routes.some((r) => r.id === id)) ?? null;

/** The course to start a job's route with: the one saved for the job that covers most, and not already the
 *  course of another route to the same job. */
export function firstCourseFor(d: Doc, jobId: string, skip: readonly (string | null)[] = []): string | null {
  const taken = new Set(skip.concat(d.routes.filter((r) => r.job === jobId).map((r) => r.course)));
  const best = d.courses
    .filter((c) => c.goals.includes(jobId) && !taken.has(c.id))
    .sort((a, b) => b.covers.length - a.covers.length)[0];
  return best?.id ?? null;
}

const same = (a: Route, b: { job: string; course: string | null }) =>
  a.job === b.job && a.course === b.course;

/** Bring routes and goals into step. Mutates. Runs after every change to the document and on load:
 *  - a route whose job is gone or no longer a goal goes; a course that is gone becomes "none yet";
 *  - the same job with the same course twice keeps the first;
 *  - a goal without a route gets one while there is room (the main goal first), else goes back to the
 *    shortlist; a goal is never left without a route;
 *  - the person is on a route that exists, and mainGoal is its job. */
export function fixRoutes(d: Doc): void {
  if (!Array.isArray(d.routes)) d.routes = [];
  const jobs = new Map(d.jobs.map((j) => [j.id, j]));
  const courses = new Set(d.courses.map((c) => c.id));
  const kept: Route[] = [];
  for (const r of d.routes) {
    if (!r || !ROUTE_IDS.includes(r.id) || kept.some((k) => k.id === r.id)) continue;
    if (jobs.get(r.job)?.role !== "goal") continue;
    const course = r.course && (r.course === DIRECT || courses.has(r.course)) ? r.course : null;
    if (kept.some((k) => same(k, { job: r.job, course }))) continue;
    kept.push(r.course === course ? r : { ...r, course });
  }
  if (kept.length !== d.routes.length || kept.some((r, i) => r !== d.routes[i])) d.routes = kept;
  const goals = d.jobs.filter((j) => j.role === "goal");
  goals.sort((a, b) => (b.id === d.mainGoal ? 1 : 0) - (a.id === d.mainGoal ? 1 : 0));
  for (const j of goals) {
    if (d.routes.some((r) => r.job === j.id)) continue;
    const id = freeRouteId(d);
    if (id) d.routes.push({ id, job: j.id, course: firstCourseFor(d, j.id) });
    else j.role = "maybe";
  }
  const cur = routeById(d, d.route) ?? sortedRoutes(d)[0] ?? null;
  if (d.route !== (cur?.id ?? null)) d.route = cur?.id ?? null;
  const main = cur?.job ?? null;
  if (d.mainGoal !== main) d.mainGoal = main;
}

/** Start a route: the job becomes a goal; the course is the one given, else the best saved for it. Returns
 *  the new route's letter, or null when all three are taken or the same route exists (then that one's). */
export function addRoute(d: Doc, jobId: string, course?: string | null): RouteId | null {
  const job = d.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const c = course === undefined ? firstCourseFor(d, jobId) : course;
  const dup = d.routes.find((r) => same(r, { job: jobId, course: c }));
  if (dup) return dup.id;
  const id = freeRouteId(d);
  if (!id) return null;
  job.role = "goal";
  d.routes.push({ id, job: jobId, course: c });
  if (c) linkCourse(d, c, jobId);
  return id;
}

/** Take a route away. Its job goes back to the shortlist unless another route still goes there. */
export function removeRoute(d: Doc, id: RouteId): void {
  const r = routeById(d, id);
  if (!r) return;
  d.routes = d.routes.filter((x) => x.id !== id);
  if (!d.routes.some((x) => x.job === r.job)) {
    const j = d.jobs.find((x) => x.id === r.job);
    if (j) j.role = "maybe";
  }
  if (d.route === id) d.route = sortedRoutes(d)[0]?.id ?? null;
}

/** Change a route's job and course in one go (the route sheet). The old job goes back to the shortlist
 *  when no route goes there any more. Returns false when another route is already the same. */
export function setRoute(d: Doc, id: RouteId, jobId: string, course: string | null): boolean {
  const r = d.routes.find((x) => x.id === id);
  const job = d.jobs.find((j) => j.id === jobId);
  if (!r || !job) return false;
  if (d.routes.some((x) => x.id !== id && same(x, { job: jobId, course }))) return false;
  const old = r.job;
  r.job = jobId;
  r.course = course;
  job.role = "goal";
  if (course) linkCourse(d, course, jobId);
  if (old !== jobId && !d.routes.some((x) => x.job === old)) {
    const oj = d.jobs.find((j) => j.id === old);
    if (oj) oj.role = "maybe";
  }
  return true;
}

/** Use a course on a route. */
export function setRouteCourse(d: Doc, id: RouteId, course: string | null): boolean {
  const r = routeById(d, id);
  return !!r && setRoute(d, id, r.job, course);
}

/** Go onto a route. */
export function switchRoute(d: Doc, id: RouteId): void {
  if (routeById(d, id)) d.route = id;
}

/** Go onto the route to a job (the first, when there are two). Returns false when no route goes there. */
export function switchToJob(d: Doc, jobId: string): boolean {
  const r = routeForJob(d, jobId);
  if (r) d.route = r.id;
  return !!r;
}

/** A course on a route is saved for its job too, so it shows on the job's page. */
function linkCourse(d: Doc, courseId: string, jobId: string): void {
  const c = d.courses.find((x) => x.id === courseId);
  if (c && !c.goals.includes(jobId)) c.goals.push(jobId);
}

/** A course was just saved for a job: a route to that job without a course takes it. Mutates. */
export function fillRouteCourse(d: Doc, courseId: string, jobId: string): void {
  const r = d.routes.find((x) => x.job === jobId && !x.course);
  if (r && !d.routes.some((x) => same(x, { job: jobId, course: courseId }))) r.course = courseId;
}
