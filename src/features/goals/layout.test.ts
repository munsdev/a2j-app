import { describe, expect, it } from "vitest";
import type { Tile, TileState } from "@/domain/skills";
import {
  boardPath,
  compareRows,
  DECK_SIZE,
  clampPos,
  dealHand,
  deckOrder,
  markSeen,
  stepPos,
  unmarked,
  slashParts,
  titleForms,
  pickDroppingOldest,
  boardLine,
  courseBadges,
  type Zone,
} from "./layout";

describe("the board's line", () => {
  const course = (id: string) => ({ id, name: "Course " + id, goals: [], covers: [] });
  const tile = (key: string, state: TileState, c?: string): Tile => ({
    x: key,
    key,
    name: key,
    state,
    also: false,
    course: c ? course(c) : null,
    level: state === "have" ? 4 : state === "some" ? 2 : 0,
    extra: true,
  });
  /** the line as words: stops by key, zones by name, lit rows in capitals */
  const line = (p: ReturnType<typeof boardPath>, cap?: number, open?: Set<Zone>) =>
    boardLine(p, cap, open)
      .map((r) => {
        const w =
          r.kind === "stop"
            ? r.tile.key
            : r.kind === "zone"
              ? r.zone + r.n
              : r.kind === "more"
                ? "+" + r.n + (r.open ? "open" : "")
                : r.kind;
        return r.lit ? w.toUpperCase() : w;
      })
      .join(" ");

  it("you, what you have, you are here, what courses cover, the next stop, the rest, the job", () => {
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
    expect(p.courses.map((c) => [c.id, c.skills.map((x) => x.key).join("")])).toEqual([
      ["c1", "bd"],
      ["c2", "c"],
    ]);
    /* the route's course is the next stop, with what it leaves open; never one skill at a time */
    expect(p.next).toMatchObject({ kind: "course", course: { id: "c1" }, open: p.learn });
    expect(line(p)).toBe("START HAVE1 A HERE courses3 b c d next learn2 e f job");
  });

  it("no course yet: the next stop is one course for all the gaps, the partly-had ones included", () => {
    const p = boardPath([tile("a", "have"), tile("b", "some"), tile("c", "learn"), tile("d", "learn")], []);
    expect(p.some.map((x) => x.key)).toEqual(["b"]);
    expect(p.next).toEqual({ kind: "find", gaps: [p.some[0], ...p.learn] });
    expect(line(p)).toBe("START HAVE1 A SOME1 B HERE next learn2 c d job");
  });

  it("a route that needs no course: the next stop is applying", () => {
    const p = boardPath([tile("a", "have"), tile("b", "learn")], [], true);
    expect(p.next).toEqual({ kind: "apply", gaps: p.learn });
    expect(line(p)).toBe("START HAVE1 A HERE next learn1 b job");
  });

  it("nothing had yet: you are at the start, the line lit only up to you", () => {
    const p = boardPath([tile("a", "learn"), tile("b", "learn")], []);
    expect(line(p)).toBe("START HERE next learn2 a b job");
  });

  it("a course saved for the job that covers none of its skills is still listed", () => {
    const p = boardPath([tile("a", "learn")], [{ id: "c9", name: "Course c9" }]);
    expect(p.courses).toEqual([{ id: "c9", name: "Course c9", skills: [] }]);
    expect(line(p)).toBe("START HERE courses0 next learn1 a job");
  });

  it("everything covered: the next stop is starting the first course, after the courses", () => {
    const p = boardPath([tile("a", "have"), tile("b", "course", "c1")], [{ id: "c1", name: "Course c1" }]);
    expect(p.next).toMatchObject({ kind: "course", course: { id: "c1" } });
    expect(line(p)).toBe("START HAVE1 A HERE courses1 b next job");
  });

  it("everything had: arrived, the whole line lit, next is job ads", () => {
    const p = boardPath([tile("a", "have"), tile("b", "have")], []);
    expect(p.next).toEqual({ kind: "done" });
    expect(line(p)).toBe("START HAVE2 A B HERE NEXT JOB");
  });

  it("long groups show the first stops and +N more, or all of them when open", () => {
    const p = boardPath(
      ["a", "b", "c", "d"]
        .map((k) => tile(k, "have"))
        .concat(["e", "f", "g", "h"].map((k) => tile(k, "learn"))),
      [],
    );
    expect(line(p, 3)).toBe("START HAVE4 A B C +1 HERE next learn4 e f g +1 job");
    expect(line(p, 3, new Set<Zone>(["learn"]))).toBe(
      "START HAVE4 A B C +1 HERE next learn4 e f g h +1open job",
    );
  });
});

describe("courseBadges", () => {
  it("a short word in brackets, else in capitals, else initials; never twice the same", () => {
    const b = courseBadges([
      { id: "1", name: "Certified fraud investigator (IHK)" },
      { id: "2", name: "Data analysis with SQL and Power BI" },
      { id: "3", name: "Lab safety refresher" },
      { id: "4", name: "CNC-Grundlagen Holzbearbeitung" },
      { id: "5", name: "Deutsch für den Beruf B1" },
      { id: "7", name: "Computer basics for the workshop" },
      { id: "6", name: "Zertifizierter Betrugsermittler (IHK)" },
    ]);
    expect([...b.values()]).toEqual(["IHK", "SQL", "LSR", "CNC", "B1", "CBW", "IHK2"]);
  });
});

describe("compareRows", () => {
  const tile = (key: string, state: TileState, name = key): Tile => ({
    x: key,
    key,
    name,
    state,
    course: null,
    also: false,
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
  it("keeps the cards seen in the order they were seen, then the best-ranked of the rest", () => {
    expect(deckOrder([], [10, 11, 12], 60)).toEqual([10, 11, 12]);
    // a new ranking after a mark reorders only the cards still ahead
    expect(deckOrder([10, 11], [12, 14, 11, 13], 60)).toEqual([10, 11, 12, 14, 13]);
    // marked cards drop out of the ranking but stay where they were seen
    expect(deckOrder([10, 11, 12], [13], 60)).toEqual([10, 11, 12, 13]);
    expect(deckOrder([5, 6], [1, 2, 3, 4], 4)).toEqual([5, 6, 1, 2]);
    expect(deckOrder([1, 2, 3], [4], 2)).toEqual([1, 2, 3]);
    expect(DECK_SIZE).toBe(60);
  });
  it("deals the cards at a position", () => {
    const view = [10, 11, 12, 13, 14];
    expect(dealHand(view, 0, 1)).toEqual([10]);
    expect(dealHand(view, 1, 3)).toEqual([11, 12, 13]);
    expect(dealHand(view, 4, 3)).toEqual([14]);
    expect(dealHand(view, 5, 3)).toEqual([]);
  });
  it("adds the cards on the table to the history once, in table order", () => {
    const seen = [10, 11];
    expect(markSeen(seen, [11])).toBe(seen);
    expect(markSeen(seen, [11, 12, 13])).toEqual([10, 11, 12, 13]);
    expect(markSeen([], [3, 1])).toEqual([3, 1]);
  });
  it("steps one card on or back, between the first card and the end", () => {
    expect(stepPos(0, -1, 5)).toBe(0);
    expect(stepPos(0, 1, 5)).toBe(1);
    expect(stepPos(4, 1, 5)).toBe(5);
    expect(stepPos(5, 1, 5)).toBe(5);
    expect(stepPos(5, -1, 5)).toBe(4);
    expect(stepPos(9, -1, 5)).toBe(4);
    expect(clampPos(9, 5)).toBe(5);
    expect(clampPos(-1, 5)).toBe(0);
  });
  it("collects the unmarked cards in deck order", () => {
    expect(unmarked([10, 11, 12, 13], (o) => o === 11 || o === 13)).toEqual([10, 12]);
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
