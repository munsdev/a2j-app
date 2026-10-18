import { describe, expect, it } from "vitest";
import examples from "@/data/examples.json";
import { emptyDoc, shape } from "@/data/doc";
import type { Doc, PartKey } from "@/data/types";
import { PARTS } from "@/domain/assess";
import { firstName, nextStep, planStarted } from "./model";

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
