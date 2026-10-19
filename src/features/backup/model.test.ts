import { describe, expect, it } from "vitest";
import examples from "@/data/examples.json";
import { emptyDoc, shape } from "@/data/doc";
import type { Doc } from "@/data/types";
import { backupBlock, backupName, checkBackup, docCounts, exportDoc } from "./model";

const holmes = (): Doc => ({ ...shape(structuredClone(examples.examples.holmes.en)), example: "holmes" });

describe("exportDoc", () => {
  it("drops the sample marker and adds the date", () => {
    const out = JSON.parse(exportDoc(holmes(), new Date("2026-10-18T12:00:00Z")));
    expect(out.example).toBeUndefined();
    expect(out.saved).toBe("2026-10-18");
    expect(out.app).toBe("a2j");
    expect(out.version).toBe(2);
    expect(out.profile.name).toBe("Sherlock Holmes");
  });
  it("does not change the document", () => {
    const d = holmes();
    exportDoc(d);
    expect(d.example).toBe("holmes");
    expect(d.saved).toBeUndefined();
  });
  it("round-trips through checkBackup and shape", () => {
    const d = holmes();
    const r = checkBackup(exportDoc(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(shape(r.doc).jobs).toEqual(d.jobs);
  });
});

describe("backupName", () => {
  const at = new Date(2026, 9, 19, 9, 5);
  it("names the file after the person and the time it was saved", () => {
    expect(backupName("Sherlock Holmes", at)).toBe("a2j-sherlock-holmes-2026-10-19-0905.json");
    expect(backupName("Jürgen Groß", at)).toBe("a2j-jurgen-gross-2026-10-19-0905.json");
    expect(backupName("  --  ", at)).toBe("a2j-profile-2026-10-19-0905.json");
  });
  it("needs something entered and a name", () => {
    const d = emptyDoc();
    expect(backupBlock(d)).toBe("empty");
    d.jobs = [{ id: "j1", title: "Baker", occ: null, role: "done", org: "", when: "" }];
    expect(backupBlock(d)).toBe("name");
    d.profile.name = "Ada";
    expect(backupBlock(d)).toBeNull();
  });
});

describe("docCounts", () => {
  it("is empty for an empty document", () => {
    expect(docCounts(emptyDoc())).toEqual([]);
  });
  it("counts every part that has content", () => {
    const d = holmes();
    const c = Object.fromEntries(docCounts(d).map((x) => [x.key, x.n]));
    expect(c.bk_n_parts).toBe(6);
    expect(c.bk_n_jobs).toBe(d.jobs.length);
    expect(c.bk_n_skills).toBe(Object.keys(d.esco.rated).length);
    expect(c.bk_n_courses).toBe(d.courses.length);
    expect(c.bk_n_ads).toBe(d.jobads.length);
  });
  it("copes with anything", () => {
    expect(docCounts(null)).toEqual([]);
    expect(docCounts({ jobs: "x", esco: [], assess: { done: { apt: "2026-01-01", foo: 1 } } })).toEqual([
      { key: "bk_n_parts", n: 1 },
    ]);
  });
});

describe("checkBackup", () => {
  it("refuses what is not a backup", () => {
    for (const s of ["", "hello", "[]", "null", '{"app":"other","version":2}', "{"])
      expect(checkBackup(s)).toEqual({ ok: false, error: "bk_bad" });
    expect(checkBackup(undefined)).toEqual({ ok: false, error: "bk_bad" });
  });
  it("refuses older versions with their own message", () => {
    expect(checkBackup('{"app":"a2j","version":1}')).toEqual({ ok: false, error: "bk_old" });
    expect(checkBackup('{"app":"a2j"}')).toEqual({ ok: false, error: "bk_old" });
    expect(checkBackup('{"app":"chart-my-skills","version":1}')).toEqual({ ok: false, error: "bk_old" });
    expect(checkBackup('{"app":"chart-my-skills","version":2}')).toEqual({ ok: false, error: "bk_old" });
  });
  it("accepts a version 2 file, with spaces around it", () => {
    const r = checkBackup('  \n{"app":"a2j","version":2,"jobs":[]}\n ');
    expect(r.ok).toBe(true);
  });
});
