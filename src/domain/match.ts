import type { Course, Doc, Job } from "@/data/types";
import type { Esco, Onet } from "./catalog";
import { interestCode, userInterests } from "./assess";
import { interestFit, occTop, quality } from "./rank";
import { jobCount } from "./skills";
import type { InterestId } from "./items";

/* =================== HOW WELL A JOB MATCHES ===================
   One score (0–100) from two reasons, both shown next to it:
   - interests: how closely the job's interest profile matches the person's six interest scores. The raw
     correlation-based fit runs from about 0.35 to 0.95 with 0.5 meaning "no relationship", so it is rescaled:
     0.4 → 0, 0.9 → 100. Without enough interest answers (part 2) there is no interest score.
   - skills: the share of the job's core skills the person has: level 3 or more in full, level 1 or 2 half (as
     the job ideas count them).
   The score is their average, or the skills alone when interests are missing. withCourses is the score once the
   course of the job's route is done (only when a course covers something). Bands: 75+ strong,
   55+ good, 35+ partial, below that low. This only describes; ranking job ideas keeps its own formula. */

export type MatchBand = 0 | 1 | 2 | 3;
export interface Match {
  score: number;
  band: MatchBand;
  /** 0–100, or null when the interests are not answered yet (or the job has no interest profile) */
  interest: number | null;
  interestBand: MatchBand | null;
  /** the job's interest types the person also has among their top three */
  sharedInterests: InterestId[];
  /** interest data comes from a similar job (rough crosswalk match) */
  rough: boolean;
  skills: number;
  have: number;
  /** partly there (level 1 or 2) */
  some: number;
  course: number;
  total: number;
  /** the score once the saved courses are done; null when no course covers a skill of this job */
  withCourses: number | null;
  withCoursesBand: MatchBand | null;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** 0–100, unrounded; round only what is shown */
const interestRaw = (fit: number): number => clamp((fit - 0.4) / 0.5) * 100;
export const interestScore = (fit: number): number => Math.round(interestRaw(fit));
export const matchBand = (score: number): MatchBand =>
  score >= 75 ? 3 : score >= 55 ? 2 : score >= 35 ? 1 : 0;

/** course: the course to count (a route being compared); left out, the course of the job's route. */
export function matchOf(
  d: Doc,
  E: Esco,
  O: Onet | null,
  occ: number,
  job?: Job | null,
  course?: Course | null,
): Match {
  const c = jobCount(d, E, occ, job, course);
  const total = c.total || 1;
  /* average the unrounded halves, round once: 28.9 and 100 give 64, not 65 */
  const skillsRaw = ((c.have + c.some / 2) / total) * 100;
  const fit = interestFit(O, occ, userInterests(d));
  const iRaw = fit == null ? null : interestRaw(fit);
  const combine = (sk: number) => Math.round(iRaw == null ? sk : (iRaw + sk) / 2);
  const skills = Math.round(skillsRaw);
  const interest = iRaw == null ? null : Math.round(iRaw);
  const score = combine(skillsRaw);
  const withCourses = c.course > 0 ? combine(((c.have + c.course + c.some / 2) / total) * 100) : null;
  const mine = new Set(interestCode(d, "en").map((r) => r.id));
  return {
    score,
    band: matchBand(score),
    interest,
    interestBand: interest == null ? null : matchBand(interest),
    sharedInterests: occTop(O, occ)
      .map((t) => t.id)
      .filter((id) => mine.has(id)),
    rough: interest != null && quality(O, occ) === 0,
    skills,
    have: c.have,
    some: c.some,
    course: c.course,
    total: c.total,
    withCourses,
    withCoursesBand: withCourses == null ? null : matchBand(withCourses),
  };
}
