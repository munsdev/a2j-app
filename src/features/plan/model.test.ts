import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { produce } from "immer";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import type { Doc } from "@/data/types";
import { loadCatalog, type Esco } from "@/domain/catalog";
import { keepFound } from "@/features/courses/found";
import { NO_COURSE, pageModel, pageText, planData, planState, suggestWhy, whyNow } from "./model";

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

  it("picks the goal's first course, keeps None for this goal, and forgets a course of another goal", () => {
    const d = doc();
    const s = planState(d, "en");
    expect(s.course).toBe(d.courses.find((c) => c.goals.includes(s.goal))!.id);
    d.summary = { ...s, course: NO_COURSE };
    expect(planState(d, "en").course).toBe(NO_COURSE);
    expect(planData(d, E, planState(d, "en")).course).toBeNull();
    d.summary = { ...s, course: NO_COURSE, courseFor: "elsewhere" };
    expect(planState(d, "en").course).toBe(s.course);
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
  it("merges with a saved item of the same name and link, and links the goal", () => {
    const d = doc();
    const c1 = d.courses[0];
    const next = produce(d, (dr) => {
      const ids = keepFound(dr, { kind: "course", job: "j6", skill: null, url: "" }, [
        { name: c1.name.toUpperCase(), fields: { url: c1.url }, azav: "", covers: ["Own skill"] },
        { name: "New one", fields: { provider: "P" }, azav: "provider", covers: [] },
      ]);
      expect(ids[0]).toBe(c1.id);
    });
    const merged = next.courses.find((c) => c.id === c1.id)!;
    expect(merged.goals).toContain("j6");
    expect(merged.covers).toContain("Own skill");
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
});
