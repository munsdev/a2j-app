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
  widthBand,
  boardLine,
  courseBadges,
  type Zone,
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

describe("the board's line", () => {
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
    expect(p.next).toEqual({ kind: "skill", tile: p.learn[0] });
    expect(line(p)).toBe("START HAVE1 A HERE courses3 b c d learn2 next f job");
  });

  it("nothing had yet: you are at the start, the line lit only up to you", () => {
    const p = boardPath([tile("a", "learn"), tile("b", "learn")], []);
    expect(line(p)).toBe("START HERE learn2 next b job");
  });

  it("a course saved for the job that covers none of its skills is still listed", () => {
    const p = boardPath([tile("a", "learn")], [{ id: "c9", name: "Course c9" }]);
    expect(p.courses).toEqual([{ id: "c9", name: "Course c9", skills: [] }]);
    expect(line(p)).toBe("START HERE courses0 learn1 next job");
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
    expect(line(p, 3)).toBe("START HAVE4 A B C +1 HERE learn4 next f g +1 job");
    expect(line(p, 3, new Set<Zone>(["learn"]))).toBe(
      "START HAVE4 A B C +1 HERE learn4 next f g h +1open job",
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
