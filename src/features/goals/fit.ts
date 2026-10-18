import type { MatchBand } from "@/domain/match";

/* Pure helpers for showing a match (domain/match.ts): the one-line summary under the score and the ring's
   arcs. No React, so they are unit-tested (fit.test.ts). */

export type SummaryKey = "s_both" | "s_int" | "s_sk" | "s_some" | "s_low" | "s_skonly";

/** One line on why the score is what it is, from the two reasons (both 0–100; interest null = not known).
 *  Strong on both · clearly led by interests · clearly led by skills · low on both · in between. */
export function matchSummary(interest: number | null, skills: number): SummaryKey {
  if (interest == null) return "s_skonly";
  if (interest >= 55 && skills >= 55) return "s_both";
  if (interest >= 65 && interest - skills >= 20) return "s_int";
  if (skills >= 65 && skills - interest >= 20) return "s_sk";
  if (interest < 35 && skills < 35) return "s_low";
  return "s_some";
}

/** The ring's arcs as shares of 100: the score, and the lighter extension up to the score with courses. */
export function ringArcs(score: number, withCourses: number | null): { score: number; ext: number } {
  const s = Math.max(0, Math.min(100, score));
  const w = withCourses == null ? s : Math.max(s, Math.min(100, withCourses));
  return { score: s, ext: w - s };
}

/** The interest line's words for an interest band. */
export const interestKey = (b: MatchBand): `i${MatchBand}` => `i${b}`;
