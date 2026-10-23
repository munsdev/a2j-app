import type { Tile, TileState } from "@/domain/skills";

/* Pure layout helpers for the Goals screens: the board's path, the compare quilt, the idea deck.
   No React and no DOM, so they are unit-tested (layout.test.ts). */

/* ---------- the board: the line ---------- */
export interface PathCourse {
  id: string;
  name: string;
  /** the skills of this job it is the course for (none: saved for the job, but no skill ticked) */
  skills: Tile[];
}
/** The one next step: find one course for all the gaps; the route's course (and the gaps it leaves open);
 *  apply (the route needs no course); job ads (every skill had). */
export type PathNext =
  | { kind: "find"; gaps: Tile[] }
  | { kind: "course"; course: PathCourse; open: Tile[] }
  | { kind: "apply"; gaps: Tile[] }
  | { kind: "done" }
  | { kind: "none" };
export interface BoardPath {
  have: Tile[];
  /** skills you have some of (level 1 or 2) that no course covers */
  some: Tile[];
  /** skills a saved course covers */
  course: Tile[];
  learn: Tile[];
  courses: PathCourse[];
  /** the one thing to do next */
  next: PathNext;
}

/** The goal's skills grouped by state, the saved courses with the skills they cover, and the one next step:
 *  with every skill had, job ads; on a route that needs no course (direct), applying; with the route's course,
 *  that course (and the gaps it leaves); else finding one course for all the gaps (some and still to learn),
 *  never one skill at a time. saved = the course of the route, if any. */
export function boardPath(
  tiles: readonly Tile[],
  saved: readonly { id: string; name: string }[],
  direct = false,
): BoardPath {
  const have = tiles.filter((x) => x.state === "have");
  const some = tiles.filter((x) => x.state === "some");
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
  const gaps = [...some, ...learn];
  const next: PathNext = all
    ? { kind: "done" }
    : direct
      ? { kind: "apply", gaps }
      : courses.length
        ? { kind: "course", course: courses[0], open: gaps }
        : gaps.length
          ? { kind: "find", gaps }
          : { kind: "none" };
  return { have, some, course, learn, courses, next };
}

export type Zone = "have" | "some" | "courses" | "learn";
type LineItem =
  | { kind: "start" }
  | { kind: "zone"; zone: Zone; n: number }
  | { kind: "stop"; tile: Tile }
  | { kind: "more"; zone: Zone; n: number; open: boolean }
  | { kind: "here" }
  | { kind: "next" }
  | { kind: "job" };
export type LineRow = LineItem & {
  /** ground covered: the line is drawn solid (green) through this row */
  lit: boolean;
};

/** The line from You to the job, one row per stop, in reading order: You; the skills you have and the ones
 *  your course covers; where you are; the ones you have some of; the next stop (one course for the gaps,
 *  your course, or applying); the rest still to learn; the job (with every skill had, the next stop is job
 *  ads, just before it). Long groups show
 *  the first `cap` stops and a "+N more" row (open = the groups shown in full). The line is lit up to
 *  where you are, all the way when you have every skill. */
export function boardLine(p: BoardPath, cap = 8, open: ReadonlySet<Zone> = new Set()): LineRow[] {
  const rows: LineItem[] = [{ kind: "start" }];
  const group = (zone: Zone, tiles: readonly Tile[], limit = cap) => {
    const all = open.has(zone) || tiles.length <= limit;
    (all ? tiles : tiles.slice(0, limit)).forEach((tile) => rows.push({ kind: "stop", tile }));
    if (tiles.length > limit) rows.push({ kind: "more", zone, n: tiles.length - limit, open: all });
  };
  if (p.have.length) {
    rows.push({ kind: "zone", zone: "have", n: p.have.length });
    group("have", p.have);
  }
  /* what your course covers counts as had, like a perk: before where you are */
  if (p.courses.length) {
    rows.push({ kind: "zone", zone: "courses", n: p.course.length });
    group("courses", p.course);
  }
  rows.push({ kind: "here" });
  const here = rows.length - 1;
  if (p.some.length) {
    rows.push({ kind: "zone", zone: "some", n: p.some.length });
    group("some", p.some);
  }
  if (p.next.kind !== "none") rows.push({ kind: "next" });
  if (p.learn.length) {
    rows.push({ kind: "zone", zone: "learn", n: p.learn.length });
    group("learn", p.learn);
  }
  rows.push({ kind: "job" });
  const done = p.next.kind === "done";
  return rows.map((r, i) => ({ ...r, lit: done || i <= here }));
}

/** A short badge per course, so a stop can say which course covers it: a short word in brackets ("IHK"),
 *  else a short word in capitals ("SQL", "B1"), else the initials of the longer words. Unique within the
 *  list (a number is added when two would read the same). */
const SMALL = new Set([
  "and",
  "for",
  "the",
  "with",
  "und",
  "für",
  "der",
  "die",
  "das",
  "den",
  "mit",
  "zum",
  "zur",
]);
export function courseBadges(courses: readonly { id: string; name: string }[]): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  courses.forEach((c) => {
    const name = c.name.trim();
    const words = name.split(/[\s\-/,:()]+/).filter(Boolean);
    const bracket = /\(([^()]{2,5})\)/.exec(name)?.[1].trim();
    const caps = words.find((w) => /^[A-ZÄÖÜ][A-ZÄÖÜ0-9]{1,4}$/.test(w));
    const initials = words
      .filter((w) => w.length > 2 && !SMALL.has(w.toLowerCase()))
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join("");
    let b = bracket || caps || initials || name.slice(0, 3).toUpperCase() || "?";
    if (used.has(b)) {
      let i = 2;
      while (used.has(b + i)) i++;
      b = b + i;
    }
    used.add(b);
    out.set(c.id, b);
  });
  return out;
}

/* ---------- compare ---------- */
export interface CompareRow {
  tile: Tile;
  /** which of the compared jobs need this skill (column indexes) */
  cols: number[];
}
const RANK: Record<TileState, number> = { have: 0, some: 1, course: 2, learn: 3 };
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

/* ---------- the idea deck ----------
   A deck you browse, not a pile you use up: Next and Back (or a swipe) move through it, marking a card
   ("I like it", "Not for me") never takes it out. The cards you have seen keep the order you saw them in
   (`seen`), so Back is predictable; the cards still ahead follow the latest ranking, which marks may change. */

/** How many ideas one deck holds. */
export const DECK_SIZE = 60;
/** The deck in order: the cards seen so far, in the order they were seen, then the best-ranked of the rest,
 *  up to `cap` cards in all. */
export function deckOrder(seen: readonly number[], ranked: readonly number[], cap = DECK_SIZE): number[] {
  const out = [...seen];
  const has = new Set(out);
  for (const o of ranked) {
    if (out.length >= cap) break;
    if (!has.has(o)) {
      has.add(o);
      out.push(o);
    }
  }
  return out;
}
/** The cards on the table at `pos`: one on phones, two or three side by side. */
export const dealHand = (view: readonly number[], pos: number, n: number): number[] =>
  view.slice(Math.max(0, pos), Math.max(0, pos) + n);
/** `seen` with the cards now on the table added at the end, in table order (the same array when nothing is new). */
export function markSeen(seen: readonly number[], hand: readonly number[]): readonly number[] {
  const has = new Set(seen);
  const fresh = hand.filter((o) => !has.has(o));
  return fresh.length ? [...seen, ...fresh] : seen;
}
/** One card on (dir 1) or back (dir -1). Positions run from the first card (0) to the end of the deck
 *  (`len`, the "you have seen them all" state). */
export const stepPos = (pos: number, dir: 1 | -1, len: number): number =>
  Math.min(len, Math.max(0, Math.min(pos, len) + dir));
/** Where you are, kept inside the deck when it got shorter (a filter, a smaller catalogue). */
export const clampPos = (pos: number, len: number): number => Math.min(len, Math.max(0, pos));
/** The cards not marked yet, in deck order: the pile for "go through the unmarked ones again". */
export const unmarked = (view: readonly number[], marked: (occ: number) => boolean): number[] =>
  view.filter((o) => !marked(o));
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
