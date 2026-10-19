import type { Doc } from "@/data/types";
import { mainGoal } from "@/data/doc";
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
  if (!allHad) return "goals";
  return planStarted(d) ? "job" : "plan";
}

/** A count as a word, up to twelve ("four", "elf"), else as digits. words: the words from zero, comma-separated. */
export function countWord(n: number, words: string, capital = false): string {
  const w = words.split(",")[n]?.trim() || String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
