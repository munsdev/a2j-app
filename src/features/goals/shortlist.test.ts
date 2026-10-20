import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import examples from "@/data/examples.json";
import { addJob, shape } from "@/data/doc";
import type { Doc } from "@/data/types";
import { loadCatalog, loadOnet, type Esco, type Onet } from "@/domain/catalog";
import { SHORT_TOP, setStar, shortlist } from "./shortlist";

describe("the shortlist: favourites, then the best matches", { timeout: 30000 }, () => {
  let E: Esco, O: Onet, d: Doc;
  beforeAll(async () => {
    vi.stubGlobal("fetch", async (u: string) => ({
      ok: true,
      json: async () => JSON.parse(readFileSync("public/esco/" + String(u).split("esco/").pop(), "utf8")),
    }));
    E = (await loadCatalog("en"))!;
    O = (await loadOnet())!;
    d = shape((examples as unknown as { examples: Record<string, { en: unknown }> }).examples.holmes.en);
    // many liked jobs, the way a long run through the ideas leaves them
    for (let i = 0; i < 9; i++) addJob(d, { title: "Liked " + i, occ: 100 + i * 37, role: "maybe" });
  });

  it("shows at most five, best match first, and keeps the rest for Show all", () => {
    const { all, top } = shortlist(d, E, O);
    expect(all.length).toBeGreaterThan(SHORT_TOP);
    expect(top).toEqual(all.slice(0, SHORT_TOP));
  });

  it("a starred job goes to the top, even with a low match; every favourite is shown", () => {
    const { all } = shortlist(d, E, O);
    const last = all.at(-1)!;
    setStar(d, last.id, true);
    expect(shortlist(d, E, O).top[0].id).toBe(last.id);
    all.slice(0, 7).forEach((j) => setStar(d, j.id, true));
    expect(shortlist(d, E, O).top.length).toBe(all.filter((j) => j.star).length);
    all.forEach((j) => setStar(d, j.id, false));
    expect(shortlist(d, E, O).all.some((j) => j.star)).toBe(false);
  });
});
