import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import type { Doc } from "@/data/types";
import { loadCatalog, loadOnet, type Esco, type Onet } from "./catalog";
import { EXPLORE, isLens, lensRank } from "./lenses";
import { rankAll } from "./rank";

describe("explore options on the samples", { timeout: 60000 }, () => {
  let E: Esco, O: Onet;
  const docs: Record<string, Doc> = {};
  beforeAll(async () => {
    vi.stubGlobal("fetch", async (u: string) => ({
      ok: true,
      json: async () => JSON.parse(readFileSync("public/esco/" + String(u).split("esco/").pop(), "utf8")),
    }));
    E = (await loadCatalog("en"))!;
    O = (await loadOnet())!;
    const ex = (examples as unknown as { examples: Record<string, { en: unknown }> }).examples;
    Object.keys(ex).forEach((k) => (docs[k] = shape(ex[k].en)));
  });

  it("knows its lenses", () => {
    expect(isLens("paths")).toBe(true);
    expect(isLens("z2")).toBe(true);
    expect(isLens("nope")).toBe(false);
  });

  it("the usual ranking is unchanged", () => {
    const d = docs.holmes;
    expect(lensRank(d, E, O, "all").map((r) => r.i)).toEqual(rankAll(d, E, O, 0).map((r) => r.i));
  });

  it("every option says why each card came up, and never deals a chosen or turned-down job", () => {
    let dealt = 0;
    Object.values(docs).forEach((d) => {
      const chosen = new Set(d.jobs.map((j) => j.occ));
      const hidden = new Set(d.esco.votes.filter((v) => v.d < 0).map((v) => v.o));
      EXPLORE.forEach((lens) => {
        const out = lensRank(d, E, O, lens);
        dealt += out.length;
        const ids = out.map((r) => r.i);
        expect(new Set(ids).size).toBe(ids.length);
        out.forEach((r) => {
          expect(r.why).toBeDefined();
          expect(chosen.has(r.i)).toBe(false);
          expect(hidden.has(r.i)).toBe(false);
        });
      });
    });
    expect(dealt).toBeGreaterThan(0);
  });

  it("paths come from O*NET related occupations of past jobs", () => {
    const d = Object.values(docs).find((x) => lensRank(x, E, O, "paths").length > 0);
    expect(d).toBeDefined();
    const out = lensRank(d!, E, O, "paths");
    const titles = new Set(d!.jobs.map((j) => j.title));
    out.forEach((r) => expect(r.why?.k === "path" && titles.has(r.why.from)).toBe(true));
  });

  it("skills: only fields the person has not worked in, with at least three skills they have", () => {
    Object.values(docs).forEach((d) => {
      const mine = new Set(d.jobs.map((j) => (j.occ != null && j.occ >= 0 ? O.f?.[j.occ] : null)));
      lensRank(d, E, O, "skills").forEach((r) => {
        expect(mine.has(O.f![r.i])).toBe(false);
        expect(r.cov!.have.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
