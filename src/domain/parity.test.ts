// The fixtures were recorded from the previous app before its code was removed, so they are the reference answers.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import type { Doc, Lang } from "@/data/types";
import { loadCatalog, loadOnet, searchOcc, type Esco, type Onet } from "./catalog";
import { jobCount, buildDeck } from "./skills";
import { interestCode, strongest } from "./assess";
import { rankAll, warnings, fitOf, physicalOf } from "./rank";
import legacy from "./__fixtures__/legacy-domain.json";

/* Parity with the previous app: compare the ported domain modules on the three sample profiles with the answers
   the previous app gave (the same in both languages, except for the search). */

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (p: string) => readFileSync(root + p, "utf8");
const fakeFetch = async (url: string) => {
  const name = String(url).split("esco/").pop()!;
  const body = read("public/esco/" + name);
  return { ok: true, json: async () => JSON.parse(body) };
};

interface Answers {
  /** have, course and total of every job with an occupation, in the profile's order */
  jobs: number[][];
  strongest: string[];
  interestCode: string[];
  /** the 60 best occupations without a zone filter: [index, score] */
  rank: [number, number][];
  /** warnings and fit of the 20 best */
  warnings: string[][];
  fit: unknown[];
  /** the 20 best occupations for zones 1 to 4 */
  byZone: Record<string, number[]>;
  deck: number[];
}
const L = legacy as unknown as {
  profiles: Record<string, Answers>;
  search: Record<Lang, Record<string, number[]>>;
};

/** Every saved course as one, the way the previous app counted coverage. */
const anyCourse = (d: Doc) => ({ ...d.courses[0], covers: d.courses.flatMap((c) => c.covers) });

const NEW_WARNINGS: string[] = ["w_lifting", "w_heights", "w_noise"];
const BODY = ["lifting", "bending", "standing", "heights", "noise", "weather"];

const EX = (examples as unknown as { examples: Record<string, Record<Lang, unknown>> }).examples;

describe.each(["en", "de"] as const)("parity with the previous app (%s)", { timeout: 30000 }, (lang) => {
  let E: Esco;
  let O: Onet;
  beforeAll(async () => {
    vi.stubGlobal("fetch", fakeFetch);
    E = (await loadCatalog(lang))!;
    O = (await loadOnet())!;
  }, 60000);

  for (const id of ["holmes", "robin", "geppetto"]) {
    it(`${id}: coverage, strengths, warnings and the job ideas match`, () => {
      const d: Doc = shape(structuredClone(EX[id][lang]));
      const theirs = L.profiles[id];
      const jobs = d.jobs.filter((x) => x.occ != null && x.occ >= 0);
      expect(jobs.length).toBe(theirs.jobs.length);
      jobs.forEach((j, k) => {
        /* the previous app let every saved course count for every job; routes count one course */
        const a = jobCount(d, E, j.occ, j, anyCourse(d));
        /* the previous app counted any rating from 1 as "have"; now 1 and 2 are "some, needs more" (or "course"
           when the course covers them), so count them the old way here */
        const had = a.tiles.filter((x) => x.level >= 1).length;
        const course = a.tiles.filter((x) => x.state === "course" && x.level < 1).length;
        expect([had, course, a.total]).toEqual(theirs.jobs[k]);
      });
      expect(strongest(d, lang).map((r) => r.id)).toEqual(theirs.strongest);
      expect(interestCode(d, lang).map((r) => r.id)).toEqual(theirs.interestCode);
      expect(E.lab.lang).toBe(lang);
      /* the previous app did not rank on the body (the physical scale, physical things ruled out): leave those
         out of the ranking for the comparison */
      const p: Doc = structuredClone(d);
      delete p.assess.setting?.physical;
      p.assess.ruledOut = (p.assess.ruledOut || []).filter((x) => !BODY.includes(x));
      const mine = rankAll(p, E, O, 0).slice(0, 60);
      expect(mine.length).toBe(60);
      expect(mine.map((r) => r.i)).toEqual(theirs.rank.map((r) => r[0]));
      mine.forEach((r, k) => expect(r.score).toBeCloseTo(theirs.rank[k][1], 10));
      mine.slice(0, 20).forEach((r, k) => {
        /* warnings added after the previous app (heavy lifting, heights, noise) are left out of the comparison */
        expect(warnings(d, O, r.i).filter((w) => !NEW_WARNINGS.includes(w))).toEqual(theirs.warnings[k]);
        expect(fitOf(d, E, O, r.i)).toEqual(theirs.fit[k]);
      });
      for (const z of [1, 2, 3, 4] as const)
        expect(
          rankAll(p, E, O, z)
            .slice(0, 20)
            .map((r) => r.i),
        ).toEqual(theirs.byZone[z]);
      expect(strongest(d, lang).length).toBeGreaterThan(2);
      expect(buildDeck(d, E).cards).toEqual(theirs.deck);
    });
  }

  it("the body moves the ranking: fewer jobs with what was ruled out, closer to the physical wish", () => {
    for (const id of ["holmes", "robin", "geppetto"]) {
      const d: Doc = shape(structuredClone(EX[id][lang]));
      const p: Doc = structuredClone(d);
      delete p.assess.setting?.physical;
      p.assess.ruledOut = [];
      const top = (x: Doc) => rankAll(x, E, O, 0).slice(0, 20);
      const clash = (x: Doc) => top(x).filter((r) => warnings(d, O, r.i).includes("w_lifting")).length;
      const far = (x: Doc) => {
        const want = ((d.assess.setting?.physical ?? 3) - 1) / 4;
        return top(x).reduce((s, r) => s + Math.abs(want - (physicalOf(O, r.i) ?? want)), 0);
      };
      expect(clash(d)).toBeLessThanOrEqual(clash(p));
      expect(far(d)).toBeLessThanOrEqual(far(p));
    }
  });

  it("search finds the same occupations", () => {
    for (const q of [
      "Verkäuferin",
      "office clerk",
      "Fachlagerist",
      "pflegefach",
      "kfz mechatroniker",
      "baker",
      "Erzieher",
    ]) {
      expect(searchOcc(E, q, 8)).toEqual(L.search[lang][q]);
      expect(searchOcc(E, q, 8).length).toBeGreaterThan(0);
    }
  });
});
