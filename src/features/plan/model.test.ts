import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { produce } from "immer";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import { DIRECT } from "@/data/routes";
import type { Doc } from "@/data/types";
import { loadCatalog, type Esco } from "@/domain/catalog";
import { keepFound } from "@/features/courses/found";
import { pageModel, pageText, planData, planState, suggestWhy, whyNow } from "./model";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const EX = (examples as unknown as { examples: Record<string, Record<string, unknown>> }).examples;
const doc = (id = "geppetto"): Doc => shape(structuredClone(EX[id].en));
let E: Esco;
beforeAll(async () => {
  vi.stubGlobal("fetch", async (url: string) => ({
    ok: true,
    json: async () =>
      JSON.parse(readFileSync(root + "public/esco/" + String(url).split("esco/").pop(), "utf8")),
  }));
  E = (await loadCatalog("en"))!;
}, 60000);

describe("the plan", () => {
  it("follows the app language until a page language is picked for it", () => {
    const d = doc();
    expect(planState(d, "de").lang).toBe("de");
    d.summary = { ...d.summary, lang: "en", langFor: "de" };
    expect(planState(d, "de").lang).toBe("en");
    expect(planState(d, "en").lang).toBe("en");
  });

  it("is about the route you are on: its job and its one course", () => {
    const d = doc("holmes");
    const s = planState(d, "en");
    const r = d.routes.find((x) => x.id === d.route)!;
    expect([s.goal, s.course]).toEqual([r.job, r.course]);
    d.route = "B";
    const b = d.routes.find((x) => x.id === "B")!;
    expect([planState(d, "en").course]).toEqual([b.course]);
    d.routes = d.routes.map((x) => (x.id === "B" ? { ...x, course: null } : x));
    expect(planData(d, E, planState(d, "en")).course).toBeNull();
  });

  it("an untouched suggested start keeps up; an edited one stays", () => {
    const d = doc();
    const x = planData(d, E, planState(d, "en"));
    const sug = suggestWhy(x);
    expect(sug).toContain("It matches my interests");
    expect(whyNow({ ...x, s: { ...x.s, why: "old", whyAuto: "old" } })).toBe(sug);
    expect(whyNow({ ...x, s: { ...x.s, why: "Mine", whyAuto: "old" } })).toBe("Mine");
  });

  it("copies as clean text, with only the ticked sections", () => {
    const d = doc();
    const s = planState(d, "en");
    const x = planData(d, E, s);
    const text = pageText(pageModel(x, "Because.", new Date(2026, 9, 18)));
    const lines = text.split("\n");
    expect(lines.slice(0, 4)).toEqual([
      "Career plan",
      "# Geppetto Polendina",
      expect.stringContaining("Nuremberg"),
      "As of 18 October 2026",
    ]);
    expect(text).toContain("\n\n## My goal\nCNC machine operator\n");
    expect(text).toContain("Because.");
    expect(text).toMatch(/\n- .+ \(via .+\)/);
    expect(text).toMatch(/\nProvider: /);
    expect(text).toContain("Bildungsgutschein for the CNC course\nGerman B1");
    expect(text).not.toMatch(/\n{3}/);
    const off = planData(d, E, { ...s, inc: { ...s.inc, head: false, strengths: false } });
    const t2 = pageText(pageModel(off, "", new Date(2026, 9, 18)));
    expect(t2).not.toContain("example.org ·");
    expect(t2).toContain("# CNC machine operator");
    expect(t2).not.toContain("## My strengths");
  });
});

describe("keeping found items", () => {
  it("saves new items, and hands back the ones that match a saved one to compare", () => {
    const d = doc();
    const c1 = d.courses[0];
    const next = produce(d, (dr) => {
      const { ids, matches } = keepFound(dr, { kind: "course", job: "j6", skill: null, url: "" }, [
        { name: c1.name.toUpperCase(), fields: { url: c1.url }, azav: "", covers: ["Own skill"] },
        { name: "New one", fields: { provider: "P" }, azav: "provider", covers: [] },
      ]);
      expect(ids.length).toBe(1);
      expect(matches.map((m) => m.savedId)).toEqual([c1.id]);
    });
    /* the match changes nothing until the person compares */
    expect(next.courses.find((c) => c.id === c1.id)).toEqual(c1);
    const added = next.courses[next.courses.length - 1];
    expect(added).toMatchObject({
      name: "New one",
      provider: "P",
      azav: "provider",
      goals: ["j6"],
      source: "ai",
    });
    expect(next.courses.length).toBe(d.courses.length + 1);
  });

  it("a route that needs no course leaves the course section off, and says so when ticked", () => {
    const d = doc("holmes");
    const r = d.routes.find((x) => x.id === d.route)!;
    r.course = DIRECT;
    /* the sample ticked its sections; a person who never touched the course box gets the default */
    if (d.summary?.inc) delete d.summary.inc.course;
    const s = planState(d, "en");
    expect(s.inc.course).toBe(false);
    const on = { ...s, inc: { ...s.inc, course: true } };
    const page = pageModel(planData(d, E, on), "", new Date(2026, 9, 19));
    const sec = page.sections.find((x) => x.k === "course")!;
    expect(sec.blocks).toEqual([{ t: "p", text: "No course needed: I am applying for this job directly." }]);
  });
});
