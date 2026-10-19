import { describe, expect, it } from "vitest";
import type { Tile, TileState } from "@/domain/skills";
import { differs, quiltRows } from "./model";

const tile = (key: string, state: TileState, also = false): Tile => ({
  x: key,
  key,
  name: key,
  state,
  course: null,
  also,
  level: 0,
  extra: false,
});

describe("the quilt", () => {
  it("one row per skill, shared skills first, a dot where a route's job does not need it", () => {
    const rows = quiltRows([
      [tile("law", "course"), tile("fraud", "have", true), tile("sql", "learn")],
      [tile("fraud", "have"), tile("sql", "course")],
      [tile("sql", "course"), tile("stats", "learn")],
    ]);
    expect(rows.map((r) => [r.key, ...r.cells])).toEqual([
      ["sql", "learn", "course", "course"],
      ["fraud", "also", "have", "none"],
      ["law", "course", "none", "none"],
      ["stats", "none", "none", "learn"],
    ]);
  });

  it("tells the rows that differ", () => {
    const [same, diff] = quiltRows([
      [tile("a", "have"), tile("b", "have")],
      [tile("a", "have"), tile("b", "have", true)],
    ]);
    expect(differs(same)).toBe(false);
    expect(differs(diff)).toBe(true);
  });
});
