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
