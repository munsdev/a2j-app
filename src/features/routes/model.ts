import type { Course, Doc, Route, SkillRef } from "@/data/types";
import { routeCourse, routeJob } from "@/data/routes";
import type { Tile } from "@/domain/skills";

/* The quilt: one row per skill any of the compared routes needs, one square per route. Pure, so it is
   unit-tested (model.test.ts). */

/** What a skill is on a route: you have it, you have it and the course repeats it, the course covers it,
 *  still to learn, or the route's job does not need it. */
export type Cell = "have" | "also" | "course" | "learn" | "none";
export interface QuiltCell {
  c: Cell;
  /** how well you can do it, 0 to 5 */
  level: number;
}
export interface QuiltRow {
  key: string;
  x: SkillRef;
  name: string;
  cells: QuiltCell[];
}

export const cellOf = (t: Tile): Cell => (t.also ? "also" : t.state);

const RANK: Record<Cell, number> = { have: 0, also: 0, course: 1, learn: 2, none: 3 };
const NONE: QuiltCell = { c: "none", level: 0 };

/** The rows: skills most routes need first, then the ones you are furthest along on, then by name. */
export function quiltRows(cols: readonly (readonly Tile[])[]): QuiltRow[] {
  const rows = new Map<string, QuiltRow>();
  cols.forEach((tiles, ci) =>
    tiles.forEach((t) => {
      const r = rows.get(t.key) ?? { key: t.key, x: t.x, name: t.name, cells: cols.map(() => NONE) };
      r.cells[ci] = { c: cellOf(t), level: t.level };
      rows.set(t.key, r);
    }),
  );
  const need = (r: QuiltRow) => r.cells.filter((c) => c.c !== "none").length;
  const best = (r: QuiltRow) => Math.min(...r.cells.map((c) => RANK[c.c]));
  return [...rows.values()].sort(
    (a, b) => need(b) - need(a) || best(a) - best(b) || a.name.localeCompare(b.name),
  );
}

/** The routes ask something different of you on this skill. */
export const differs = (r: QuiltRow): boolean => r.cells.some((c) => c.c !== r.cells[0].c);

/** A square as five parts, like the skill ratings: what you can do (green), what the course adds on top
 *  (blue, up to five), and the rest: still to learn (dashed) when you cannot do it yet, room to grow
 *  (plain) when you can. */
export type Part = "have" | "course" | "learn" | "room";
export function bar(cell: QuiltCell): Part[] {
  const covered = cell.c === "course" || cell.c === "also";
  return [0, 1, 2, 3, 4].map((i) =>
    i < cell.level ? "have" : covered ? "course" : cell.level ? "room" : "learn",
  );
}

/** The words for each state (the routes strings). */
const CELL_KEY = {
  have: "q_k_have",
  also: "q_k_also",
  course: "q_k_course",
  learn: "q_k_learn",
  none: "q_k_none",
} as const;
export const cellKey = (c: Cell) => CELL_KEY[c];

/** A route as words: its job and its course. */
export function routeWords(d: Doc, r: Route): { job: string; course: Course | null } {
  return { job: routeJob(d, r)?.title ?? "", course: routeCourse(d, r) };
}
