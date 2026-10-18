import { describe, expect, it } from "vitest";
import type { Tile, TileState } from "@/domain/skills";
import {
  bandWidth,
  boardPath,
  compareRows,
  dealHand,
  deckIndex,
  ideaSlots,
  slashParts,
  titleForms,
  pickDroppingOldest,
  segmentLit,
  widthBand,
} from "./layout";

describe("widths", () => {
  it("bands round-trip to the same layout decisions", () => {
    for (const w of [320, 390, 559, 560, 759, 760, 899, 900, 999, 1000, 1179, 1180, 1440]) {
      const b = bandWidth(widthBand(w));
      expect(ideaSlots(b)).toBe(ideaSlots(w));
    }
  });
  it("deals one, two or three idea cards", () => {
    expect(ideaSlots(390)).toBe(1);
    expect(ideaSlots(768)).toBe(2);
    expect(ideaSlots(1280)).toBe(3);
  });
});

describe("boardPath", () => {
  const course = (id: string) => ({ id, name: "Course " + id, goals: [], covers: [] });
  const tile = (key: string, state: TileState, c?: string): Tile => ({
    x: key,
    key,
    name: key,
    state,
    course: c ? course(c) : null,
    level: state === "have" ? 2 : 0,
    extra: true,
  });
  const ms = (p: ReturnType<typeof boardPath>) => p.milestones.join(" ");

  it("groups the skills into milestones; the guide stands on the courses, next is the first uncovered skill", () => {
    const p = boardPath(
      [
        tile("a", "have"),
        tile("b", "course", "c1"),
        tile("c", "course", "c2"),
        tile("d", "course", "c1"),
        tile("e", "learn"),
        tile("f", "learn"),
      ],
      [{ id: "c1", name: "Course c1" }],
    );
    expect(ms(p)).toBe("you have courses learn job");
    expect(p.here).toBe("courses");
    expect(p.courses.map((c) => [c.id, c.skills.map((x) => x.key).join("")])).toEqual([
      ["c1", "bd"],
      ["c2", "c"],
    ]);
    expect(p.next).toEqual({ kind: "skill", tile: p.learn[0] });
    expect([0, 1, 2, 3].map((i) => segmentLit(p, i))).toEqual([true, true, false, false]);
  });

  it("no course yet: the courses milestone stays (quietly), the guide stands on what you have", () => {
    const p = boardPath([tile("a", "have"), tile("b", "learn")], []);
    expect(ms(p)).toBe("you have courses learn job");
    expect(p.courses).toEqual([]);
    expect(p.here).toBe("have");
  });

  it("a course saved for the job that covers none of its skills is still listed", () => {
    const p = boardPath([tile("a", "learn")], [{ id: "c9", name: "Course c9" }]);
    expect(p.courses).toEqual([{ id: "c9", name: "Course c9", skills: [] }]);
    expect(p.here).toBe("you");
  });

  it("everything covered: next is starting the first course", () => {
    const p = boardPath([tile("a", "have"), tile("b", "course", "c1")], [{ id: "c1", name: "Course c1" }]);
    expect(ms(p)).toBe("you have courses job");
    expect(p.next).toMatchObject({ kind: "course", course: { id: "c1" } });
  });

  it("everything had: the guide stands on the job, next is job ads", () => {
    const p = boardPath([tile("a", "have"), tile("b", "have")], []);
    expect(ms(p)).toBe("you have job");
    expect(p.here).toBe("job");
    expect(p.next).toEqual({ kind: "done" });
    expect(segmentLit(p, 1)).toBe(true);
  });

  it("nothing had yet: the guide waits on You", () => {
    const p = boardPath([tile("a", "learn")], []);
    expect(p.here).toBe("you");
    expect(segmentLit(p, 0)).toBe(false);
  });
});

describe("compareRows", () => {
  const tile = (key: string, state: TileState, name = key): Tile => ({
    x: key,
    key,
    name,
    state,
    course: null,
    level: 0,
    extra: true,
  });
  it("shared skills first, then have → course → learn, then by name", () => {
    const rows = compareRows([
      [tile("b", "learn"), tile("a", "learn"), tile("s", "learn")],
      [tile("s", "learn"), tile("c", "course"), tile("h", "have")],
    ]);
    expect(rows.map((r) => r.tile.key)).toEqual(["s", "h", "c", "a", "b"]);
    expect(rows[0].cols).toEqual([0, 1]);
    expect(rows[1].cols).toEqual([1]);
  });
});

describe("pickDroppingOldest", () => {
  it("keeps at most three, dropping the oldest", () => {
    expect(pickDroppingOldest(["a", "b", "c"], "d")).toEqual(["b", "c", "d"]);
    expect(pickDroppingOldest(["a", "b"], "a")).toEqual(["b"]);
    expect(pickDroppingOldest([], "a")).toEqual(["a"]);
  });
});

describe("the deck", () => {
  const occs = [10, 11, 12, 13, 14];
  const hidden = (o: number) => o === 10 || o === 12;
  it("skips hidden ideas but keeps the card being rated", () => {
    expect(deckIndex(occs, 0, hidden, null)).toBe(1);
    expect(deckIndex(occs, 0, hidden, 10)).toBe(0);
    expect(deckIndex(occs, 2, hidden, null)).toBe(3);
    expect(deckIndex(occs, 0, () => true, null)).toBe(5);
  });
  it("deals a hand of visible cards", () => {
    expect(dealHand(occs, 0, 3, hidden, null)).toEqual([11, 13, 14]);
    expect(dealHand(occs, 0, 2, hidden, 12)).toEqual([11, 12]);
  });
  it("breaks titles after slashes", () => {
    expect(slashParts("waiter/waitress")).toEqual(["waiter/", "waitress"]);
    expect(slashParts("cook")).toEqual(["cook"]);
  });
  it("splits a title into its two forms only when both are words", () => {
    expect(titleForms("Privatdetektiv/Privatdetektivin")).toEqual(["Privatdetektiv", "Privatdetektivin"]);
    expect(titleForms("TCP/IP engineer")).toBeNull();
    expect(titleForms("cook")).toBeNull();
    expect(titleForms("a/b/c")).toBeNull();
  });
});
