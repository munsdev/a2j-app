import { describe, expect, it } from "vitest";
import { emptyDoc } from "@/data/doc";
import type { Doc } from "@/data/types";
import type { Esco } from "@/domain/catalog";
import { INT_ITEMS, SETTING } from "@/domain/items";
import {
  advance,
  cleanJobs,
  digitKey,
  dotFill,
  guessSkill,
  partAfter,
  partCardText,
  settingPrefs,
  startPos,
  swipeDir,
  todayIso,
  togglePickWithinMax,
  topSkills,
  wantRows,
} from "./logic";

const items = INT_ITEMS.slice(0, 4);
const answered = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, 3]));

describe("question runs", () => {
  it("start at the first unanswered question, or the first one", () => {
    expect(startPos(items, {})).toBe(0);
    expect(startPos(items, answered(items[0].id, items[1].id))).toBe(2);
    expect(startPos(items, answered(...items.map((x) => x.id)))).toBe(0);
  });
  it("go forward, wrap once to the first skipped question, then finish", () => {
    const ans = answered(items[0].id, items[2].id, items[3].id);
    expect(advance({ pos: 0, wrapped: false }, items, ans)).toEqual({ pos: 1, wrapped: false });
    expect(advance({ pos: 3, wrapped: false }, items, ans)).toEqual({ pos: 1, wrapped: true });
    expect(advance({ pos: 3, wrapped: true }, items, ans)).toBe("finish");
    expect(advance({ pos: 3, wrapped: false }, items, answered(...items.map((x) => x.id)))).toBe("finish");
  });
});

describe("parts", () => {
  it("suggest the next unfinished part, wrapping to the start", () => {
    const d = emptyDoc();
    d.assess = { done: { apt: "2026-01-01", int: "2026-01-01" } };
    expect(partAfter(d, "int")).toBe("set");
    d.assess.done = { set: "x", val: "x", story: "x", skills: "x", int: "x" };
    expect(partAfter(d, "skills")).toBe("apt");
    d.assess.done.apt = "x";
    expect(partAfter(d, "apt")).toBeNull();
  });
  it("label the card like the previous app", () => {
    expect(partCardText({ done: true, n: 3, t: 45 })).toEqual({ status: "st_done", button: "b_redo" });
    expect(partCardText({ done: false, n: 3, t: 45 })).toEqual({ status: "st_prog", button: "b_cont" });
    expect(partCardText({ done: false, n: 0, t: 45 })).toEqual({ status: "st_todo", button: "b_start" });
    /* skills count ratings but have no total: Continue, still "Not started" */
    expect(partCardText({ done: false, n: 4 })).toEqual({ status: "st_todo", button: "b_cont" });
  });
  it("write today's date", () => {
    expect(todayIso(new Date("2026-10-18T12:00:00Z"))).toBe("2026-10-18");
  });
});

describe("results", () => {
  it("turn setting answers into preferences, leaving out 'either'", () => {
    const p = settingPrefs(SETTING, { people: 1, outdoors: 4, physical: 3 }, "en");
    expect(p).toEqual([
      { id: "people", clearly: true, x: "on my own" },
      { id: "outdoors", clearly: false, x: "outdoors" },
    ]);
    /* German nouns keep their capitals */
    expect(settingPrefs(SETTING, { people: 5 }, "de")[0].x).toBe("Mit vielen Menschen");
  });
  it("draw half dots", () => {
    expect([1, 2, 3, 4, 5].map((i) => dotFill(3.5, i))).toEqual(["on", "on", "on", "half", "off"]);
  });
  it("list the best skills first, own skills after, ten rated at most", () => {
    const rated: Record<string, number> = { 5: 2, 7: 0, 9: 5 };
    for (let i = 20; i < 32; i++) rated[i] = 1;
    const own = [
      { name: "Juggling", level: 3 },
      { name: "Nothing", level: 0 },
    ];
    const top = topSkills(rated, own, (i) => "s" + i);
    expect(top.slice(0, 2)).toEqual(["s9", "s5"]);
    expect(top).toHaveLength(11);
    expect(top[10]).toBe("Juggling");
    expect(top).not.toContain("s7");
    expect(topSkills({ 1: 4 }, own, (i) => "s" + i)).toEqual(["s1", "Juggling"]);
  });
  it("sort the want sheet by level, then name", () => {
    const names: Record<number, string> = { 1: "Beta", 2: "Alpha", 3: "Gamma" };
    expect(wantRows({ 1: 3, 2: 3, 3: 5, 4: 0 }, (i) => names[i])).toEqual([
      [3, 5],
      [2, 3],
      [1, 3],
    ]);
  });
});

describe("values", () => {
  it("pick up to three in order, tap again to remove", () => {
    expect(togglePickWithinMax([], "a")).toEqual(["a"]);
    expect(togglePickWithinMax(["a", "b", "c"], "d")).toEqual(["a", "b", "c"]);
    expect(togglePickWithinMax(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
});

describe("your story", () => {
  it("drops empty job rows and repairs the main goal", () => {
    const d: Doc = emptyDoc();
    d.jobs = [
      { id: "j1", title: "", occ: null, role: "goal", org: "", when: "" },
      { id: "j2", title: "Baker", occ: 3, role: "goal", org: "", when: "" },
      { id: "j3", title: "", occ: null, role: "done", org: "", when: "" },
    ];
    d.mainGoal = "j1";
    cleanJobs(d);
    expect(d.jobs.map((j) => j.id)).toEqual(["j2"]);
    expect(d.mainGoal).toBe("j2");
    d.jobs = [];
    cleanJobs(d);
    expect(d.mainGoal).toBeNull();
  });
});

describe("skills typed in plain words", () => {
  const labels = ["mix chemicals", "chemistry", "play the violin"];
  const E = { lab: { sk: labels }, skN: labels.map((l) => [l]) } as unknown as Esco;
  it("recognise an exact skill, offer close ones, or keep the words", () => {
    expect(guessSkill(E, "Chemistry")).toEqual({ kind: "exact" });
    expect(guessSkill(E, "chem")).toEqual({ kind: "meant", hits: [1, 0] });
    expect(guessSkill(E, "woodturning")).toEqual({ kind: "own" });
  });
});

describe("input", () => {
  it("reads swipes", () => {
    expect(swipeDir(-80, 10)).toBe("next");
    expect(swipeDir(90, -20)).toBe("back");
    expect(swipeDir(-40, 0)).toBeNull();
    expect(swipeDir(-80, 60)).toBeNull();
  });
  it("reads digit keys in range", () => {
    expect(digitKey("3", 1, 5)).toBe(3);
    expect(digitKey("0", 1, 5)).toBeNull();
    expect(digitKey("0", 0, 5)).toBe(0);
    expect(digitKey("a", 0, 5)).toBeNull();
  });
});
