import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import type { Doc } from "@/data/types";
import { loadCatalog, loadOnet, type Esco, type Onet } from "./catalog";
import { interestScore, matchBand, matchOf } from "./match";

describe("match scale", () => {
  it("rescales the interest fit so 'no relationship' is 0", () => {
    expect(interestScore(0.4)).toBe(0);
    expect(interestScore(0.35)).toBe(0);
    expect(interestScore(0.65)).toBe(50);
    expect(interestScore(0.9)).toBe(100);
    expect(interestScore(0.97)).toBe(100);
  });
  it("bands", () => {
    expect([0, 34, 35, 54, 55, 74, 75, 100].map(matchBand)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});

describe("matchOf on the Holmes sample (the numbers in the approved mockup)", { timeout: 30000 }, () => {
  let E: Esco, O: Onet, d: Doc;
  beforeAll(async () => {
    vi.stubGlobal("fetch", async (u: string) => ({
      ok: true,
      json: async () => JSON.parse(readFileSync("public/esco/" + String(u).split("esco/").pop(), "utf8")),
    }));
    E = (await loadCatalog("en"))!;
    O = (await loadOnet())!;
    d = shape((examples as unknown as { examples: Record<string, { en: unknown }> }).examples.holmes.en);
  });
  const job = (title: string) => d.jobs.find((j) => j.title === title)!;

  it("a past job: strong skills, weak interests → a good match", () => {
    const m = matchOf(d, E, O, job("Private investigator").occ!, job("Private investigator"));
    expect([m.interest, m.skills, m.score, m.band]).toEqual([29, 100, 64, 2]);
    expect(m.withCourses).toBeNull();
  });

  it("route A: low today, partial once its course is done (only the IHK course counts)", () => {
    const m = matchOf(d, E, O, job("Fraud investigator").occ!, job("Fraud investigator"));
    expect([m.interest, m.skills, m.have, m.course, m.total]).toEqual([36, 27, 4, 3, 15]);
    expect([m.score, m.band, m.withCourses, m.withCoursesBand]).toEqual([31, 0, 41, 1]);
  });

  it("without interest answers the score is the skills alone", () => {
    const bare = { ...d, assess: { ...d.assess, answers: {} } };
    const m = matchOf(bare, E, O, job("Private investigator").occ!, job("Private investigator"));
    expect([m.interest, m.score]).toEqual([null, 100]);
  });
});
