import { describe, expect, it } from "vitest";
import { matchSummary, ringArcs } from "./fit";

describe("matchSummary", () => {
  it("the cases in the approved mockup", () => {
    expect(matchSummary(29, 100)).toBe("s_sk"); // a past job: strong skills, weak interests
    expect(matchSummary(85, 14)).toBe("s_int"); // an idea: loved interests, few skills
  });
  it("strong on both", () => {
    expect(matchSummary(55, 55)).toBe("s_both");
    expect(matchSummary(90, 60)).toBe("s_both");
  });
  it("led by one reason only when that one is high and clearly ahead", () => {
    expect(matchSummary(64, 30)).toBe("s_some"); // ahead, but not high enough to say "very much"
    expect(matchSummary(70, 52)).toBe("s_some"); // high, but not clearly ahead
    expect(matchSummary(30, 64)).toBe("s_some");
    expect(matchSummary(40, 90)).toBe("s_sk");
  });
  it("low on both, and in between", () => {
    expect(matchSummary(20, 10)).toBe("s_low");
    expect(matchSummary(34, 34)).toBe("s_low");
    expect(matchSummary(36, 27)).toBe("s_some");
  });
  it("without interests it says the score is skills only", () => {
    expect(matchSummary(null, 100)).toBe("s_skonly");
    expect(matchSummary(null, 0)).toBe("s_skonly");
  });
});

describe("ringArcs", () => {
  it("extends from the score up to the score with courses", () => {
    expect(ringArcs(31, 45)).toEqual({ score: 31, ext: 14 });
    expect(ringArcs(31, null)).toEqual({ score: 31, ext: 0 });
  });
  it("stays inside 0–100 and never draws backwards", () => {
    expect(ringArcs(120, 130)).toEqual({ score: 100, ext: 0 });
    expect(ringArcs(50, 40)).toEqual({ score: 50, ext: 0 });
    expect(ringArcs(-5, null)).toEqual({ score: 0, ext: 0 });
  });
});
