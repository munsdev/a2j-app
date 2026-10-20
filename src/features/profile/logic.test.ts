import { describe, expect, it } from "vitest";
import { emptyDoc } from "@/data/doc";
import type { Doc } from "@/data/types";
import type { Esco } from "@/domain/catalog";
import { SETTING } from "@/domain/items";
import {
  cleanJobs,
  digitKey,
  dotFill,
  guessSkill,
  partAfter,
  partCardText,
  settingPrefs,
  laterStep,
  startWalk,
  stepOn,
  swipeDir,
  todayIso,
  togglePickWithinMax,
  topSkills,
  wantRows,
} from "./logic";

describe("question runs", () => {
  const done =
    (...ns: number[]) =>
    (i: number) =>
      ns.includes(i);
  it("start with the open cards only, or all of them when every one is done", () => {
    expect(startWalk(4, done()).order).toEqual([0, 1, 2, 3]);
    expect(startWalk(4, done(0, 1))).toEqual({ order: [2, 3], pos: 0, first: 2 });
    expect(startWalk(4, done(0, 1, 2, 3)).order).toEqual([0, 1, 2, 3]);
  });
  it("skipped cards come back once, one after another, at the end, then finish", () => {
    /* 50 cards; 4, 22 and 38 skipped (card numbers 3, 21 and 37) */
    const skipped = [3, 21, 37];
    const d = (i: number) => !skipped.includes(i);
    let w = startWalk(50, () => false);
    w = { ...w, pos: 49 };
    const r = stepOn(w, d);
    expect(r).not.toBe("finish");
    const w2 = r as Exclude<typeof r, "finish">;
    expect(w2.order.slice(50)).toEqual(skipped);
    expect(w2.order[w2.pos]).toBe(3);
    expect(laterStep(w2)).toEqual([1, 3]);
    const end = { ...w2, pos: w2.order.length - 1 };
    expect(laterStep(end)).toEqual([3, 3]);
    /* still skipped on the second pass: finish, they stay open */
    expect(stepOn(end, d)).toBe("finish");
  });
  it("nothing skipped: finish after the last card", () => {
    expect(stepOn({ order: [0, 1], pos: 1, first: 2 }, () => true)).toBe("finish");
    expect(laterStep({ order: [0, 1], pos: 1, first: 2 })).toBeNull();
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
