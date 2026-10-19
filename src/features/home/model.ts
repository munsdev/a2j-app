import type { Doc } from "@/data/types";
import { jobsIn, mainGoal } from "@/data/doc";
import { currentRoute, isDirect, routeCourse } from "@/data/routes";
import { dupePairs } from "@/data/dupes";
import { canRank } from "@/domain/rank";
import { nextPart, partsDone } from "@/domain/assess";

/* Pure helpers for Home. */

export interface NextStep {
  /** the route Continue goes to */
  to: string;
  /** the name of the section, a key of the shared strings */
  label: "nav_profile" | "nav_goals" | "nav_plan";
}

/** The plan counts as started once anything was chosen or written on it. */
export const planStarted = (d: Doc): boolean => Object.keys(d.summary || {}).length > 0;

/** Where Continue goes: the next profile part, then a goal, then the plan. */
export function nextStep(d: Doc): NextStep {
  const done = partsDone(d);
  const g = mainGoal(d);
  const part = (): NextStep => ({ to: "profile/" + nextPart(d), label: "nav_profile" });
  if (!g && done < 6) return part();
  if (!g) return { to: "goals", label: "nav_goals" };
  if (done < 4) return part();
  return planStarted(d) ? { to: "goals", label: "nav_goals" } : { to: "plan", label: "nav_plan" };
}

/* ---------- the next steps in the app ----------
   Not the next skill to learn (the board shows that): the next thing to do here, in the order the app is
   meant to be used. Each is checked against the document, so a step drops off once it is done. */
export type StepId =
  | "profile_start"
  | "ideas_unlock"
  | "ideas"
  | "route"
  | "profile"
  | "course"
  | "dupes"
  | "route2"
  | "ads"
  | "apply"
  | "plan"
  | "plan_print";

/** A route is ready to apply on when it needs no course, or the person has every core skill of its job. */
export function readyToApply(d: Doc, allHad: boolean): boolean {
  return allHad || isDirect(currentRoute(d));
}

/** Saved ads for the route's job that the person has applied for (or got further with). */
const APPLIED = new Set(["applied", "rejected", "accepted", "interview"]);

/** The steps still open, first the one to do now. allHad: every core skill of the route's job is had. On a
 *  route ready to apply on, finding a course gives way to job ads and applying. */
export function appSteps(d: Doc, allHad = false): StepId[] {
  const done = partsDone(d);
  const r = currentRoute(d);
  const liked = jobsIn(d, "maybe").length + jobsIn(d, "goal").length > 0;
  const out: StepId[] = [];
  if (done === 0) out.push("profile_start");
  if (!liked && canRank(d)) out.push("ideas");
  else if (!liked && done > 0) out.push("ideas_unlock");
  else if (liked && !r) out.push("route");
  if (done > 0 && done < 6) out.push("profile");
  const ready = readyToApply(d, allHad);
  const ads = r ? d.jobads.filter((a) => a.goals.includes(r.job)) : [];
  if (ready && !ads.length) out.push("ads");
  if (ready && ads.length && !ads.some((a) => APPLIED.has(a.status ?? ""))) out.push("apply");
  if (r && !ready && !routeCourse(d, r)) out.push("course");
  if (dupePairs(d).length) out.push("dupes");
  if (r && d.routes.length < 2) out.push("route2");
  if (r && !ready && !ads.length) out.push("ads");
  if (r) out.push(planStarted(d) ? "plan_print" : "plan");
  return out;
}

/** The first word of a name, for the welcome. */
export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? "";

/* ---------- the line on Home: Start · Profile · Goals · Plan · Job ---------- */
export type LineStop = "start" | "profile" | "goals" | "plan" | "job";
export const LINE_STOPS: readonly LineStop[] = ["start", "profile", "goals", "plan", "job"];

/** Where the person is on Home's line: on the profile until it is done or there is a goal, then on the
 *  goals while skills are left to get, then on the plan, then at the job. allHad: every skill of the main
 *  goal is had. */
export function lineStop(d: Doc, allHad: boolean): Exclude<LineStop, "start"> {
  if (!mainGoal(d)) return partsDone(d) < 6 ? "profile" : "goals";
  if (!readyToApply(d, allHad)) return "goals";
  return planStarted(d) ? "job" : "plan";
}

/** A count as a word, up to twelve ("four", "elf"), else as digits. words: the words from zero, comma-separated. */
export function countWord(n: number, words: string, capital = false): string {
  const w = words.split(",")[n]?.trim() || String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
