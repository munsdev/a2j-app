import type { Doc } from "@/data/types";
import { jobsIn } from "@/data/doc";
import { normTxt, searchSkillScored, type Esco, type Onet } from "./catalog";
import { assessOf, userInterests } from "./assess";
import { SETTING } from "./items";
import { coverage } from "./skills";
import { READY, ctx, interestFit, occTop, physicalOf, rankAll, type Idea, type Zone } from "./rank";

/* =================== EXPLORE OPTIONS: OTHER WAYS INTO THE IDEAS ===================
   The job ideas deck can be dealt from different angles, all from open data (ESCO, O*NET) and what the person
   entered, never written by hand:
   - for you (the usual ranking), ready now, or one preparation level;
   - skills: jobs that need many of the skills you have, in fields you have not worked or aimed in (O*NET-SOC
     major group);
   - paths: where people from your jobs go (O*NET Related Occupations);
   - hobbies: the skills your hobbies and side projects name (ESCO search), and the jobs that need them;
   - step: jobs where only one to three core skills are missing;
   - love: jobs built on the skills you want to use more;
   - day: jobs whose working day is like the one you described (part 3: people, outdoors, physical, customers,
     variety, hours);
   - wild: jobs from fields far from your usual ideas that still match your interests.
   Each job says why it came up (Idea.why). Pure. */

export type Lens =
  | "all"
  | "ready"
  | "z1"
  | "z2"
  | "z3"
  | "z4"
  | "skills"
  | "paths"
  | "hobbies"
  | "step"
  | "love"
  | "day"
  | "wild";
/** The explore options: other angles than the usual ranking. */
export type ExploreLens = "skills" | "paths" | "hobbies" | "step" | "love" | "day" | "wild";
export const EXPLORE: readonly ExploreLens[] = ["skills", "paths", "hobbies", "step", "love", "day", "wild"];
export const LENSES: readonly Lens[] = ["all", "ready", "z1", "z2", "z3", "z4", ...EXPLORE];
export const isLens = (v: unknown): v is Lens => LENSES.includes(v as Lens);

/** Every job that could be an idea: the usual ranking's rows, and any other job not chosen or turned down. */
function pool(d: Doc, E: Esco, O: Onet | null) {
  const base = rankAll(d, E, O, 0);
  const by = new Map(base.map((r) => [r.i, r]));
  const chosen = new Set(d.jobs.map((j) => j.occ));
  const hidden = new Set((d.esco.hidden || []).concat(d.esco.votes.filter((v) => v.d < 0).map((v) => v.o)));
  const u = userInterests(d);
  const rated = Object.values(d.esco.rated).some((l) => l > 0);
  const get = (i: number): Idea | null => {
    const r = by.get(i);
    if (r) return r;
    if (chosen.has(i) || hidden.has(i) || (E.g.e[i]?.length ?? 0) < 3) return null;
    const fit = u ? interestFit(O, i, u) : null;
    const cov = rated ? coverage(d, E, i) : null;
    const made: Idea = { i, fit, cov, skillOnly: fit == null, score: fit ?? cov?.score ?? 0, base: 0 };
    by.set(i, made);
    return made;
  };
  return { base, get };
}

/** The fields the person knows: of the jobs they did, aim at or keep on the shortlist. */
const myFields = (d: Doc, O: Onet | null): Set<number> =>
  new Set(
    d.jobs
      .map((j) => (j.occ != null && j.occ >= 0 ? (O?.f?.[j.occ] ?? null) : null))
      .filter((f): f is number => f != null),
  );

const withWhy = (r: Idea, why: NonNullable<Idea["why"]>): Idea => ({ ...r, why });

/** The ideas for a lens, best first. */
export function lensRank(d: Doc, E: Esco, O: Onet | null, lens: Lens): Idea[] {
  if (lens === "all") return rankAll(d, E, O, 0);
  if (lens === "ready") return rankAll(d, E, O, READY);
  if (lens[0] === "z") return rankAll(d, E, O, +lens.slice(1) as Zone);
  const { base, get } = pool(d, E, O);
  const field = (i: number) => O?.f?.[i] ?? null;

  if (lens === "skills") {
    const mine = myFields(d, O);
    return base
      .filter((r) => r.cov && r.cov.have.length >= 3 && field(r.i) != null && !mine.has(field(r.i)!))
      .sort((a, b) => b.cov!.have.length - a.cov!.have.length || b.score - a.score)
      .map((r) => withWhy(r, { k: "skills", n: r.cov!.have.length, x: r.cov!.have.slice(0, 3) }));
  }

  if (lens === "paths") {
    const out: Idea[] = [];
    const seen = new Set<number>();
    jobsIn(d, "done").forEach((j) => {
      if (j.occ == null || j.occ < 0) return;
      (O?.rel?.[j.occ] ?? []).forEach((i) => {
        const r = !seen.has(i) && get(i);
        if (!r) return;
        seen.add(i);
        out.push(withWhy(r, { k: "path", from: j.title }));
      });
    });
    return out;
  }

  if (lens === "hobbies") {
    /* the person's own words looked up as skills: a whole phrase that a skill's label contains, or a single
       word that is a word of only a few skills' labels (a telling word: "clocks", "puppet"; "studies" or
       "children" name too many to say anything). Loose matches ("footprints" → foot care) are left out. */
    const phrases = [d.profile.hobbies, d.profile.projects]
      .join("\n")
      .split(/[,;\n.]|\s+(?:and|und)\s+/i)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3);
    const skillWords = new Map<number, string>();
    const add = (x: number, w: string) => {
      if (!skillWords.has(x)) skillWords.set(x, w);
    };
    phrases.forEach((p) => {
      const q = normTxt(p);
      searchSkillScored(E, p, 3).forEach(([score, x]) => {
        // the phrase at the start of a word: German "Boxen" is not in "Beschneideboxen"
        const l = E.skN[x][0];
        if (score >= 60 && (l.startsWith(q) || l.includes(" " + q))) add(x, p);
      });
    });
    phrases.forEach((p) =>
      p
        .split(/[^\p{L}]+/u)
        .map(normTxt)
        .filter((q) => q.length >= 5 && !STOP.has(q))
        .forEach((q) => {
          const same = (t: string) =>
            t.length >= q.length - 2 && t.length <= q.length + 2 && (t.startsWith(q) || q.startsWith(t));
          const hits: number[] = [];
          // in the person's language only: a German word can be an English one ("Boxen", boxes)
          E.skN.forEach((ls, x) => {
            if (ls[0].split(" ").some(same)) hits.push(x);
          });
          if (hits.length <= TELLING) hits.forEach((x) => add(x, q));
        }),
    );
    if (!skillWords.size) return [];
    /* a job ranks by how many of the person's words it takes up, then by how many of its skills they name
       (an essential skill counts 1, an optional one half) */
    const hits: { r: Idea; words: number; n: number; x: number }[] = [];
    E.g.e.forEach((ess, i) => {
      let n = 0;
      let x = -1;
      const words = new Set<string>();
      const take = (s: number, k: number) => {
        const w = skillWords.get(s);
        if (w == null) return;
        n += k;
        words.add(w);
        if (x < 0) x = s;
      };
      ess.forEach((s) => take(s, 1));
      (E.g.o[i] || []).forEach((s) => take(s, 0.5));
      const r = n > 0 && get(i);
      if (r) hits.push({ r, words: words.size, n, x });
    });
    return hits
      .sort((a, b) => b.words - a.words || b.n - a.n || b.r.score - a.r.score)
      .map(({ r, x }) => withWhy(r, { k: "hobby", words: skillWords.get(x)!, x }));
  }

  if (lens === "step") {
    return base
      .filter((r) => r.cov && r.cov.have.length >= 3 && r.cov.miss.length >= 1 && r.cov.miss.length <= 3)
      .sort((a, b) => a.cov!.miss.length - b.cov!.miss.length || b.score - a.score)
      .map((r) => withWhy(r, { k: "step", x: r.cov!.miss }));
  }

  if (lens === "love") {
    const want = d.esco.want || {};
    const up = new Set(
      Object.keys(want)
        .filter((x) => want[x] === 1)
        .map(Number),
    );
    if (!up.size) return [];
    const hits: { r: Idea; x: number[] }[] = [];
    E.g.e.forEach((ess, i) => {
      const x = ess.filter((s) => up.has(s));
      const r = x.length > 0 && get(i);
      if (r) hits.push({ r, x });
    });
    return hits
      .sort((a, b) => b.x.length - a.x.length || b.r.score - a.r.score)
      .map(({ r, x }) => withWhy(r, { k: "love", x }));
  }

  if (lens === "day") {
    /* the day the person described (part 3), against each job's working day (O*NET), 0..1 on both sides */
    const s = assessOf(d).setting;
    const job: Record<string, (i: number) => number | null> = {
      people: (i) => pct(ctx(O, i, "contact")),
      outdoors: (i) => pct(ctx(O, i, "outdoors")),
      physical: (i) => physicalOf(O, i),
      customers: (i) => pct(ctx(O, i, "customers")),
      variety: (i) => {
        const v = pct(ctx(O, i, "routine"));
        return v == null ? null : 1 - v;
      },
      hours: (i) => pct(ctx(O, i, "irregular")),
    };
    const rows = SETTING.filter((r) => s[r.id] != null && job[r.id]);
    if (!rows.length || !O) return [];
    const out: { r: Idea; fit: number; x: string[] }[] = [];
    base.forEach((r) => {
      let sum = 0;
      let n = 0;
      const x: string[] = [];
      rows.forEach((row) => {
        const want = (s[row.id] - 1) / 4;
        const v = job[row.id](r.i);
        if (v == null) return;
        const gap = Math.abs(want - v);
        sum += gap;
        n += 1;
        if (s[row.id] !== 3 && gap <= 0.25) x.push(row.id);
      });
      if (n >= 3) out.push({ r, fit: 1 - sum / n + 0.15 * r.score, x });
    });
    return out.sort((a, b) => b.fit - a.fit).map(({ r, x }) => withWhy(r, { k: "day", x }));
  }

  /* wild: fields far from the usual ideas (the fields of the first 30), still a good interest match */
  const usual = new Set(
    base
      .slice(0, 30)
      .map((r) => field(r.i))
      .concat([...myFields(d, O)]),
  );
  return base
    .filter((r) => field(r.i) != null && !usual.has(field(r.i)) && (r.fit ?? 0) >= 0.55)
    .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0))
    .map((r) => withWhy(r, { k: "wild", x: occTop(O, r.i).map((t) => t.id) }));
}

/** A word names a skill when at most this many skills have it in their label. */
const TELLING = 10;
/* everyday words that name no skill, though a few labels have them */
const STOP = new Set(
  "about after short money family families group groups local house homes raised small young people other there their which where while years lokal lokale lokalen gruppe gruppen hause kurze kurzen kleine kleinen familie familien leute menschen geld".split(
    " ",
  ),
);

const pct = (v: number | null): number | null => (v == null ? null : v / 100);
