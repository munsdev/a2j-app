import type { Tile, TileState } from "@/domain/skills";

/* Pure layout helpers for the Goals screens: the board's path, the compare quilt, the idea deck.
   No React and no DOM, so they are unit-tested (layout.test.ts). */

/* ---------- widths ---------- */
/** The breakpoints the Goals screens lay out by (the previous app re-rendered when one was crossed). */
export const BREAKS = [560, 760, 900, 1000, 1180] as const;
/** Which band a viewport width falls in: 0 (< 560) … 5 (≥ 1180). */
export const widthBand = (w: number): number => BREAKS.filter((b) => w >= b).length;
/** A width inside a band, so layout helpers can take a plain number. */
export const bandWidth = (band: number): number => [400, 600, 800, 950, 1100, 1280][band] ?? 1280;

/** Cards side by side on the idea deck: one on phones, two on tablets, three on computers. */
export const ideaSlots = (w: number): 1 | 2 | 3 => (w >= 1180 ? 3 : w >= 760 ? 2 : 1);

/* ---------- the board: a path with milestones ---------- */
export type Milestone = "you" | "have" | "courses" | "learn" | "job";
export interface PathCourse {
  id: string;
  name: string;
  /** the skills of this job it is the course for (none: saved for the job, but no skill ticked) */
  skills: Tile[];
}
export type PathNext =
  | { kind: "skill"; tile: Tile }
  | { kind: "course"; course: PathCourse }
  | { kind: "done" }
  | { kind: "none" };
export interface BoardPath {
  have: Tile[];
  /** skills a saved course covers */
  course: Tile[];
  learn: Tile[];
  courses: PathCourse[];
  /** the milestones shown, in order */
  milestones: Milestone[];
  /** where the guide stands */
  here: Milestone;
  /** the one thing to do next */
  next: PathNext;
}

/** The goal's skills grouped into milestones from You to the job. The guide stands on the last milestone
 *  reached: the courses once a saved course covers something, else what you have, else You; on the job when
 *  you have every skill. Next is the first skill no course covers; when every one is covered, starting the
 *  first course; when you have them all, job ads. saved = courses saved for this job, in order. */
export function boardPath(tiles: readonly Tile[], saved: readonly { id: string; name: string }[]): BoardPath {
  const have = tiles.filter((x) => x.state === "have");
  const course = tiles.filter((x) => x.state === "course");
  const learn = tiles.filter((x) => x.state === "learn");
  const byId = new Map<string, PathCourse>();
  course.forEach((x) => {
    const c = x.course!;
    const e = byId.get(c.id) ?? { id: c.id, name: c.name, skills: [] };
    e.skills.push(x);
    byId.set(c.id, e);
  });
  saved.forEach((c) => {
    if (!byId.has(c.id)) byId.set(c.id, { id: c.id, name: c.name, skills: [] });
  });
  const courses = [...byId.values()];
  const all = tiles.length > 0 && have.length === tiles.length;
  const milestones: Milestone[] = ["you", "have"];
  if (courses.length || learn.length) milestones.push("courses");
  if (learn.length) milestones.push("learn");
  milestones.push("job");
  const here: Milestone = all ? "job" : course.length ? "courses" : have.length ? "have" : "you";
  const next: PathNext = learn.length
    ? { kind: "skill", tile: learn[0] }
    : course.length
      ? { kind: "course", course: courses[0] }
      : all
        ? { kind: "done" }
        : { kind: "none" };
  return { have, course, learn, courses, milestones, here, next };
}
/** The line from a milestone to the next one is lit (apricot) up to where the guide stands. */
export const segmentLit = (p: BoardPath, i: number): boolean => i + 1 <= p.milestones.indexOf(p.here);

/* ---------- compare ---------- */
export interface CompareRow {
  tile: Tile;
  /** which of the compared jobs need this skill (column indexes) */
  cols: number[];
}
const RANK: Record<TileState, number> = { have: 0, course: 1, learn: 2 };
/** The skills of the compared jobs, one row each: shared by most jobs first, then have → course → learn,
 *  then by name. */
export function compareRows(jobs: readonly (readonly Tile[])[]): CompareRow[] {
  const need = new Map<string, CompareRow>();
  jobs.forEach((tiles, ci) =>
    tiles.forEach((t) => {
      const e = need.get(t.key) ?? { tile: t, cols: [] };
      if (!e.cols.includes(ci)) e.cols.push(ci);
      need.set(t.key, e);
    }),
  );
  return [...need.values()].sort(
    (a, b) =>
      b.cols.length - a.cols.length ||
      RANK[a.tile.state] - RANK[b.tile.state] ||
      a.tile.name.localeCompare(b.tile.name),
  );
}
/** Pick a job to compare: up to three; a fourth pushes out the oldest pick. Picking a picked job drops it. */
export function pickDroppingOldest(picks: readonly string[], id: string, max = 3): string[] {
  if (picks.includes(id)) return picks.filter((x) => x !== id);
  const next = [...picks, id];
  return next.length > max ? next.slice(next.length - max) : next;
}

/* ---------- the idea deck ---------- */
/** The first idea at or after `from` that is still to show: not skipped, not saved, not voted down.
 *  The card being rated stays, even though it is now voted on. */
export function deckIndex(
  occs: readonly number[],
  from: number,
  hidden: (occ: number) => boolean,
  rating: number | null,
): number {
  let i = Math.max(0, from);
  while (i < occs.length && occs[i] !== rating && hidden(occs[i])) i++;
  return i;
}
/** The cards on the table when several fit side by side. */
export function dealHand(
  occs: readonly number[],
  from: number,
  n: number,
  hidden: (occ: number) => boolean,
  rating: number | null,
): number[] {
  const out: number[] = [];
  for (let j = from; j < occs.length && out.length < n; j++) {
    const o = occs[j];
    if (o === rating || !hidden(o)) out.push(o);
  }
  return out;
}
/** A title with a break opportunity after each slash ("Waiter/waitress" wraps after the slash). */
export const slashParts = (title: string): string[] => title.split(/(?<=\/)/);

/** A title with two forms ("Polizeibeamter im Dienst/Polizeibeamtin im Dienst", "Waiter/waitress"): the first
 *  form and the rest, so the rest can go on a quieter second line. null when the slash is part of a name
 *  ("TCP/IP engineer"): exactly one slash, and at least five letters on either side. */
export function titleForms(title: string): [string, string] | null {
  const parts = title.split("/");
  if (parts.length !== 2) return null;
  const [a, b] = parts.map((x) => x.trim());
  return a.length >= 5 && b.length >= 5 ? [a, b] : null;
}
