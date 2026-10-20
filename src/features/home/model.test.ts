import { describe, expect, it } from "vitest";
import examples from "@/data/examples.json";
import { emptyDoc, shape } from "@/data/doc";
import type { Doc, PartKey } from "@/data/types";
import { PARTS } from "@/domain/assess";
import { DIRECT } from "@/data/routes";
import { appSteps, countWord, firstName, lineStop, nextStep, planStarted } from "./model";

const holmes = (): Doc => ({ ...shape(structuredClone(examples.examples.holmes.en)), example: "holmes" });
const withDone = (d: Doc, parts: readonly PartKey[]): Doc => ({
  ...d,
  assess: { ...d.assess, done: Object.fromEntries(parts.map((k) => [k, "2026-10-01"])) },
});
const withGoal = (d: Doc): Doc => ({
  ...d,
  jobs: [{ id: "j1", title: "Baker", occ: null, role: "goal", org: "", when: "" }],
  mainGoal: "j1",
});

describe("nextStep", () => {
  it("starts with the first profile part", () => {
    expect(nextStep(emptyDoc())).toEqual({ to: "profile/apt", label: "nav_profile" });
  });
  it("goes to the next unfinished part while there is no goal", () => {
    expect(nextStep(withDone(emptyDoc(), ["apt", "int"]))).toEqual({
      to: "profile/set",
      label: "nav_profile",
    });
    expect(nextStep(withDone(emptyDoc(), ["apt", "set"]))).toEqual({
      to: "profile/int",
      label: "nav_profile",
    });
  });
  it("asks for a goal once the profile is done", () => {
    expect(nextStep(withDone(emptyDoc(), PARTS))).toEqual({ to: "goals", label: "nav_goals" });
  });
  it("with a goal, finishes the first four parts first", () => {
    expect(nextStep(withGoal(withDone(emptyDoc(), ["apt", "int", "set"])))).toEqual({
      to: "profile/val",
      label: "nav_profile",
    });
  });
  it("with a goal and four parts, goes to the plan, or back to goals once the plan is started", () => {
    const d = withGoal(withDone(emptyDoc(), ["apt", "int", "set", "val"]));
    expect(nextStep(d)).toEqual({ to: "plan", label: "nav_plan" });
    expect(nextStep({ ...d, summary: { why: "x" } })).toEqual({ to: "goals", label: "nav_goals" });
  });
  it("a finished sample goes to goals", () => {
    const d = holmes();
    expect(planStarted(d)).toBe(true);
    expect(nextStep(d)).toEqual({ to: "goals", label: "nav_goals" });
  });
});

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Sherlock Holmes")).toBe("Sherlock");
    expect(firstName("  Ann  ")).toBe("Ann");
    expect(firstName("")).toBe("");
  });
});

describe("lineStop", () => {
  it("profile first, then goals, then plan, then the job", () => {
    expect(lineStop(emptyDoc(), false)).toBe("profile");
    expect(lineStop(withDone(emptyDoc(), PARTS), false)).toBe("goals");
    const g = withGoal(emptyDoc());
    expect(lineStop(g, false)).toBe("goals");
    expect(lineStop(g, true)).toBe("plan");
    expect(lineStop({ ...g, summary: { why: "x" } }, true)).toBe("job");
  });
});

describe("countWord", () => {
  const en = "zero,one,two,three,four,five,six,seven,eight,nine,ten,eleven,twelve";
  it("words up to twelve, digits after", () => {
    expect(countWord(4, en, true)).toBe("Four");
    expect(countWord(11, en)).toBe("eleven");
    expect(countWord(13, en, true)).toBe("13");
  });
});

describe("appSteps: the next thing to do in the app, not the next skill", () => {
  it("starts with the profile", () => {
    expect(appSteps(emptyDoc())).toEqual(["profile_start"]);
  });
  it("then a job to aim for, a course for its route, a second route, ads and the plan", () => {
    const d = shape(withGoal(withDone(emptyDoc(), PARTS)));
    expect(appSteps(d)).toEqual(["course", "route2", "ads", "plan"]);
    expect(appSteps({ ...d, summary: { why: "x" } }).at(-1)).toBe("plan_print");
  });
  it("Holmes, with three routes and courses: no course or route steps left", () => {
    const s = appSteps(holmes());
    expect(s).not.toContain("course");
    expect(s).not.toContain("route2");
    expect(["plan", "plan_print"]).toContain(s.at(-1));
  });
});

describe("appSteps: a route ready to apply on", () => {
  const base = () => shape(withGoal(withDone(emptyDoc(), PARTS)));
  const direct = () => {
    const d = base();
    d.routes[0].course = DIRECT;
    return d;
  };
  const withAd = (d: Doc, status?: "applied" | "interested"): Doc => ({
    ...d,
    jobads: [{ id: "a1", name: "Baker at Müller", goals: ["j1"], status }],
  });
  it("no course needed: job ads first, never a course", () => {
    expect(appSteps(direct())).toEqual(["ads", "route2", "plan"]);
    expect(lineStop(direct(), false)).toBe("plan");
  });
  it("with every core skill, the same, even without saying so", () => {
    expect(appSteps(base(), true)).toEqual(["ads", "route2", "plan"]);
  });
  it("ads saved but none applied for: apply comes first", () => {
    expect(appSteps(withAd(direct()))[0]).toBe("apply");
    expect(appSteps(withAd(direct(), "applied"))).not.toContain("apply");
  });
});

describe("the samples", () => {
  const sample = (id: "robin" | "geppetto"): Doc => ({
    ...shape(structuredClone(examples.examples[id].en)),
    example: id,
  });
  it("Robin is on route A to Fundraiser with no course needed, route B takes the course", () => {
    const d = sample("robin");
    expect(d.route).toBe("A");
    expect(d.routes.map((r) => [r.id, r.job, r.course])).toEqual([
      ["A", "j4", DIRECT],
      ["B", "j4", "c1"],
    ]);
    expect(appSteps(d)).not.toContain("course");
    /* applying, not arrived: most core skills are still to get and there is no offer yet */
    expect(lineStop(d, false)).toBe("plan");
  });
  it("Geppetto is on the CNC course route, with route B to quality inspector for toys and no course", () => {
    const d = sample("geppetto");
    expect(d.route).toBe("A");
    expect(d.routes.find((r) => r.id === "B")).toEqual({ id: "B", job: "j6", course: DIRECT });
  });
});
