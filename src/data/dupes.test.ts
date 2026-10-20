import { describe, expect, it } from "vitest";
import { produce } from "immer";
import type { Doc } from "./types";
import { emptyDoc, shape } from "./doc";
import { dupePairs, fieldDiffs, mergeItem, mergeJobs, normUrl, notDupe, sameItem } from "./dupes";

function doc(): Doc {
  const d = emptyDoc();
  d.jobs = [
    { id: "j1", title: "Fraud investigator", occ: 1, role: "goal", org: "", when: "" },
    { id: "j2", title: "Fraud Investigator", occ: -1, role: "maybe", org: "", when: "" },
    { id: "j3", title: "Clerk", occ: 4, role: "done", org: "", when: "" },
    { id: "j4", title: "Clerk", occ: 4, role: "done", org: "", when: "" },
  ];
  d.courses = [
    {
      id: "c1",
      name: "Fraud investigator (IHK)",
      provider: "IHK Berlin",
      start: "1 Mar",
      goals: ["j1"],
      covers: [1],
    },
    { id: "c2", name: "Fraud Investigator – IHK", provider: "", price: "€2,400", goals: ["j2"], covers: [2] },
    { id: "c3", name: "Fraud investigator (IHK)", provider: "TÜV", goals: [], covers: [] },
  ];
  return shape(d);
}

describe("duplicates", () => {
  it("are strict: the same link, or the same name, whatever the provider", () => {
    expect(normUrl("https://www.Example.org/kurs/?id=2#top")).toBe("example.org/kurs?id=2");
    expect(sameItem("course", { url: "http://example.org/a/" }, { url: "example.org/a", name: "x" })).toBe(
      true,
    );
    expect(sameItem("course", { name: "SQL basics" }, { name: "sql  Basics!" })).toBe(true);
    expect(
      sameItem("course", { name: "SQL basics", provider: "VHS" }, { name: "SQL basics", provider: "IHK" }),
    ).toBe(true);
    expect(sameItem("course", { name: "SQL basics" }, { name: "SQL basics 2" })).toBe(false);
  });

  it("finds saved pairs, past jobs aside, and forgets a pair said to differ", () => {
    const d = doc();
    /* the same name: compared, whatever the provider */
    expect(dupePairs(d)).toEqual([
      { kind: "course", a: "c1", b: "c2" },
      { kind: "course", a: "c1", b: "c3" },
      { kind: "course", a: "c2", b: "c3" },
      { kind: "job", a: "j1", b: "j2" },
    ]);
    const after = produce(d, (x) => notDupe(x as Doc, { kind: "job", a: "j2", b: "j1" }));
    expect(dupePairs(after).map((p) => p.kind)).toEqual(["course", "course", "course"]);
  });

  it("lists only the fields that differ; an empty saved field takes the new value", () => {
    const { diffs, same } = fieldDiffs(
      ["name", "start", "price", "url"],
      { name: "A", start: "1 Mar", url: "" },
      { name: "A", start: "12 Jan", price: "€90", url: "" },
    );
    expect(same).toBe(1);
    expect(diffs).toEqual([
      { k: "start", saved: "1 Mar", other: "12 Jan", pick: "saved" },
      { k: "price", saved: "", other: "€90", pick: "other" },
    ]);
  });

  it("merging courses keeps both covers and goals, and routes follow the kept one", () => {
    let d = doc();
    d = produce(d, (x) => {
      x.routes = [{ id: "A", job: "j1", course: "c2" }];
      mergeItem(x as Doc, "course", "c1", { price: "€2,400", start: "" }, {}, "c2");
    });
    const c1 = d.courses.find((c) => c.id === "c1")!;
    expect(d.courses.map((c) => c.id)).toEqual(["c1", "c3"]);
    expect([c1.price, c1.start, c1.goals, c1.covers]).toEqual(["€2,400", undefined, ["j1", "j2"], [1, 2]]);
    expect(d.routes[0].course).toBe("c1");
  });

  it("merging jobs moves courses, ads and routes; a goal stays a goal", () => {
    let d = doc();
    d = produce(d, (x) => mergeJobs(x as Doc, "j2", "j1"));
    const j2 = d.jobs.find((j) => j.id === "j2")!;
    expect([j2.role, j2.occ]).toEqual(["goal", 1]);
    expect(d.courses.find((c) => c.id === "c1")!.goals).toEqual(["j2"]);
    expect(d.routes.map((r) => r.job)).toEqual(["j2"]);
  });
});
