import { describe, expect, it } from "vitest";
import type { Tile, TileState } from "@/domain/skills";
import { bar, differs, quiltRows } from "./model";

const tile = (key: string, state: TileState, also = false, level = state === "have" ? 2 : 0): Tile => ({
  x: key,
  key,
  name: key,
  state,
  course: null,
  also,
  level,
  extra: false,
});

describe("the quilt", () => {
  it("one row per skill, shared skills first, a dot where a route's job does not need it", () => {
    const rows = quiltRows([
      [tile("law", "course"), tile("fraud", "have", true), tile("sql", "learn")],
      [tile("fraud", "have"), tile("sql", "course")],
      [tile("sql", "course"), tile("stats", "learn")],
    ]);
    expect(rows.map((r) => [r.key, ...r.cells.map((c) => c.c)])).toEqual([
      ["sql", "learn", "course", "course"],
      ["fraud", "also", "have", "none"],
      ["law", "course", "none", "none"],
      ["stats", "none", "none", "learn"],
    ]);
  });

  it("draws a square as five parts: your level, then what the course adds, else the rest to learn", () => {
    expect(bar({ c: "also", level: 2 })).toEqual(["have", "have", "course", "course", "course"]);
    expect(bar({ c: "have", level: 2 })).toEqual(["have", "have", "room", "room", "room"]);
    expect(bar({ c: "course", level: 0 })).toEqual(["course", "course", "course", "course", "course"]);
    expect(bar({ c: "learn", level: 0 })).toEqual(["learn", "learn", "learn", "learn", "learn"]);
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
