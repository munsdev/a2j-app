// The fixtures were recorded from the previous app before its code was removed, so they are the reference answers.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import type { Doc, Lang, SkillRef } from "@/data/types";
import { loadCatalog, type Esco } from "@/domain/catalog";
import { profileFacts } from "@/features/prompts/facts";
import { LIB, libContains, libText } from "@/features/prompts/library";
import { planData, planState, suggestWhy } from "@/features/plan/model";
import { aiPrompt, searchWords } from "./text";
import { readFound } from "./found";
import { extractJSON } from "./parse";
import type { FinderSpec } from "./types";
import legacy from "./__fixtures__/legacy-courses.json";

/* Parity with the previous app: compare the texts the finder, the prompt library and the plan build on the three
   sample profiles with the texts the previous app built. */

const root = fileURLToPath(new URL("../../../", import.meta.url));
const read = (p: string) => readFileSync(root + p, "utf8");
const fakeFetch = async (url: string) => {
  const name = String(url).split("esco/").pop()!;
  const body = read("public/esco/" + name);
  return { ok: true, json: async () => JSON.parse(body) };
};

interface PlanAnswers {
  apt: unknown;
  ints: unknown;
  vals: unknown;
  skills: unknown;
  gaps: unknown;
  others: unknown;
  wantMore: unknown;
  /** id of the suggested course, or null */
  course: string | null;
  suggest: string;
}
interface Answers {
  /** search words and AI prompt for each finder spec, then for the first spec with course wishes saved */
  finder: { words: string; prompt: string }[];
  facts: unknown;
  library: Record<string, { text: string; contains: string }>;
  /** the "translate" prompt with past "Bäcker" and goal "Koch" */
  translate: string;
  plan: PlanAnswers;
  /** the plan with the page in the other language */
  planOther: Pick<PlanAnswers, "skills" | "gaps" | "suggest">;
}
const L = legacy as unknown as Record<Lang, Record<string, Answers>> & {
  /** what extractJSON read from each answer of the last test */
  extract: unknown[];
};

const EX = (examples as unknown as { examples: Record<string, Record<Lang, unknown>> }).examples;
const IDS = ["holmes", "robin", "geppetto"] as const;

describe.each(["en", "de"] as const)("courses, prompts and plan match the previous app (%s)", (lang) => {
  let E: Esco;
  beforeAll(async () => {
    vi.stubGlobal("fetch", fakeFetch);
    E = (await loadCatalog(lang))!;
  }, 60000);
  const load = (id: string): Doc => shape(structuredClone(EX[id][lang]));

  for (const id of IDS) {
    it(`${id}: search words and AI prompts`, () => {
      const d = load(id);
      const theirs = L[lang][id].finder;
      const goal = d.jobs.find((j) => j.role === "goal")!;
      const tile = d.courses[0]?.covers[0];
      const specs: FinderSpec[] = [
        { kind: "course", job: goal.id, skill: null, url: "" },
        { kind: "course", job: goal.id, skill: null, url: "https://example.org/kurs" },
        { kind: "jobad", job: goal.id, skill: null, url: "" },
        { kind: "jobad", job: goal.id, skill: null, url: "https://example.org/stelle" },
      ];
      if (tile != null) specs.push({ kind: "course", job: goal.id, skill: tile, url: "" });
      expect(theirs.length).toBe(specs.length + 1);
      specs.forEach((F, k) => {
        expect(searchWords(d, E, F)).toBe(theirs[k].words);
        expect(aiPrompt(d, E, F, lang)).toBe(theirs[k].prompt);
      });
      /* course wishes saved in the profile change both texts */
      d.profile.coursePrefs = { lang: "en", where: "online", time: "eve", start: "6", voucher: false };
      expect(searchWords(d, E, specs[0])).toBe(theirs[specs.length].words);
      expect(aiPrompt(d, E, specs[0], lang)).toBe(theirs[specs.length].prompt);
    });

    it(`${id}: every library prompt and its "Contains" line`, () => {
      const d = load(id);
      const theirs = L[lang][id];
      expect(profileFacts(d, E, lang)).toEqual(theirs.facts);
      expect(LIB.map((x) => x.k).sort()).toEqual(Object.keys(theirs.library).sort());
      for (const item of LIB) {
        expect(libText(d, E, lang, item.k)).toBe(theirs.library[item.k].text);
        expect(libContains(d, E, lang, item)).toBe(theirs.library[item.k].contains);
      }
      expect(libText(d, E, lang, "translate", { past: "Bäcker", goal: "Koch" })).toBe(theirs.translate);
    });

    it(`${id}: the plan's data and suggested start`, () => {
      const d = load(id);
      const y = L[lang][id].plan;
      const x = planData(d, E, planState(d, lang));
      expect(x.apt).toEqual(y.apt);
      expect(x.ints).toEqual(y.ints);
      expect(x.vals).toEqual(y.vals);
      expect(x.skills).toEqual(y.skills);
      expect(x.gaps).toEqual(y.gaps);
      expect(x.others).toEqual(y.others);
      expect(x.wantMore).toEqual(y.wantMore);
      expect(x.course?.id ?? null).toBe(y.course);
      expect(suggestWhy(x)).toBe(y.suggest);
      /* the page in the other language */
      const other: Lang = lang === "en" ? "de" : "en";
      d.summary = { ...d.summary, lang: other, langFor: lang };
      const x2 = planData(d, E, planState(d, lang));
      const y2 = L[lang][id].planOther;
      expect(x2.L).toBe(other);
      expect(x2.skills).toEqual(y2.skills);
      expect(x2.gaps).toEqual(y2.gaps);
      expect(suggestWhy(x2)).toBe(y2.suggest);
    });
  }

  it("reads answers like the previous app", () => {
    const answers = [
      '```json\n{"courses":[{"name":"A","azav":"yes"},]}\n```',
      'Text {"kurse":[{"name":"B"}]} more {"kurse":[{"name":"C"}]}',
      "{“jobads”: [{“name”: “Lagerist”, “url”: “https://x.de”}]}",
      "nothing",
    ];
    expect(L.extract.length).toBe(answers.length);
    answers.forEach((a, k) => expect(extractJSON(a)).toEqual(L.extract[k]));
  });

  it("maps the skills a course covers by their exact names, in both languages", () => {
    const d = load("geppetto");
    const goal = d.jobs.find((j) => j.role === "goal")!;
    const ess = E.g.e[goal.occ!];
    const [a, b] = [ess[0], ess[1]];
    const answer = JSON.stringify({
      courses: [
        {
          name: "CNC basics",
          provider: "Werkstatt",
          url: "kurs.example.org/cnc",
          azav: "Ja, laut Seite",
          covers: [E.en!.sk[a], E.de!.sk[b].toUpperCase(), "something else"],
          note: "short",
        },
        { name: "", provider: "skip me" },
        { name: "Bad link", url: "javascript:alert(1)", azav: "unknown" },
      ],
    });
    const F: FinderSpec = { kind: "course", job: goal.id, skill: null, url: "" };
    const found = readFound(d, E, F, answer);
    expect(found.map((f) => f.name)).toEqual(["CNC basics", "Bad link"]);
    expect(found[0].covers).toEqual([a, b] as SkillRef[]);
    expect(found[0].azav).toBe("provider");
    expect(found[0].fields).toMatchObject({
      provider: "Werkstatt",
      url: "kurs.example.org/cnc",
      notes: "short",
    });
    expect(found[1].fields.url).toBeUndefined();
    expect(found[1].azav).toBe("");
    /* for one skill, that skill is always covered */
    const one = readFound(d, E, { ...F, skill: "Own words" }, answer);
    expect(one[0].covers).toContain("Own words");
  });
});
