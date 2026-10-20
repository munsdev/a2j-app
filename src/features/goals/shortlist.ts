import type { Doc, Job } from "@/data/types";
import { jobsIn } from "@/data/doc";
import type { Esco, Onet } from "@/domain/catalog";
import { matchOf } from "@/domain/match";

/* =================== THE SHORTLIST ===================
   A thumbs-up on a job idea keeps the job (it shapes the ranking too), so the liked jobs can be many. The
   shortlist shows the favourites (starred) and fills up to SHORT_TOP with the best matches of the rest; the
   others wait behind "Show all". Pure. */

export const SHORT_TOP = 5;

/** The liked jobs, favourites first, then by match; `top` is the part shown before "Show all". */
export function shortlist(d: Doc, E: Esco, O: Onet | null): { all: Job[]; top: Job[] } {
  const score = (j: Job) => {
    if ((j.occ ?? -1) < 0 && !j.extra?.length) return -1;
    const m = matchOf(d, E, O, j.occ ?? -1, j);
    return m.total ? m.score : -1;
  };
  const all = jobsIn(d, "maybe")
    .map((j, n) => ({ j, s: score(j), n }))
    .sort((a, b) => +!!b.j.star - +!!a.j.star || b.s - a.s || a.n - b.n)
    .map((x) => x.j);
  const stars = all.filter((j) => j.star).length;
  return { all, top: all.slice(0, Math.max(SHORT_TOP, stars)) };
}

/** Star or unstar a liked job. */
export function setStar(d: Doc, id: string, on: boolean): void {
  const j = d.jobs.find((x) => x.id === id);
  if (!j) return;
  if (on) j.star = true;
  else delete j.star;
}
