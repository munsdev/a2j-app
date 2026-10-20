import type { Doc, SkillRef, Vote } from "@/data/types";
import { jobsIn } from "@/data/doc";
import type { ContextKey, Esco, Onet } from "./catalog";
import { coverage, type Coverage } from "./skills";
import { assessOf, userInterests } from "./assess";
import { INTERESTS, type Interest, type InterestId } from "./items";

/* =================== JOB IDEAS: RANKING WITHOUT AI ===================
   Suggests occupations from three signals:
   - interests: the person's six interest scores against the occupation's RIASEC profile
     (O*NET data joined through the official ESCO to O*NET crosswalk)
   - skills: share of the occupation's essential skills the person rated
   - reactions: thumbs on jobs and on single skills, and skills they want more or less of
   - the body: how physical the job is against the person's wish, and physical things they ruled out
   Work context gives warnings. Without the O*NET file, ideas use skills only. */

export type WarningKey =
  | "w_people"
  | "w_alone"
  | "w_customers"
  | "w_outdoors"
  | "w_indoors"
  | "w_standing"
  | "w_sitting"
  | "w_hands"
  | "w_phone"
  | "w_irregular"
  | "w_vehicle"
  | "w_routine"
  | "w_licence"
  | "w_lifting"
  | "w_heights"
  | "w_noise";
export type Zone = 1 | 2 | 3 | 4;
/** The deck filter for "ready now": jobs to apply for straight away. */
export const READY = 5;
/** What the ideas are filtered by: a preparation level, READY, or 0 for all. */
export type DeckFilter = Zone | 0 | typeof READY;
export type FitBand = 0 | 1 | 2 | 3;

/* ---------- interests ---------- */
function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma,
      db = b[i] - mb;
    sab += da * db;
    saa += da * da;
    sbb += db * db;
  }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
}
export function occInterest(O: Onet | null, i: number): number[] | null {
  const r = O?.r?.[i];
  return r && r.length === 6 ? r.map((v) => v / 10) : null;
}
export function interestFit(O: Onet | null, i: number, u: number[] | null): number | null {
  const o = occInterest(O, i);
  if (!o || !u) return null;
  return (pearson(u, o) + 1) / 2;
}
/** The occupation's two strongest interest types. */
export function occTop(O: Onet | null, i: number): Interest[] {
  const o = occInterest(O, i);
  if (!o) return [];
  return INTERESTS.map((t, k) => [o[k], t] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 2)
    .map((x) => x[1]);
}
export function ctx(O: Onet | null, i: number, k: string): number | null {
  const c = O?.c?.[k as ContextKey];
  return c && c[i] != null ? c[i] : null;
}
/** Things about the job that clash with the person's setting and what they ruled out. */
export function warnings(d: Doc, O: Onet | null, i: number): WarningKey[] {
  const a = assessOf(d);
  const s = a.setting;
  const out = new Set(a.ruledOut);
  const w: WarningKey[] = [];
  const hi = (k: ContextKey, t = 70) => {
    const v = ctx(O, i, k);
    return v != null && v >= t;
  };
  const lo = (k: ContextKey, t = 25) => {
    const v = ctx(O, i, k);
    return v != null && v <= t;
  };
  const le = (k: string, n: number) => s[k] != null && s[k] <= n;
  const ge = (k: string, n: number) => s[k] != null && s[k] >= n;
  if (le("people", 2) && hi("contact", 92)) w.push("w_people");
  if (ge("people", 4) && lo("contact", 55)) w.push("w_alone");
  if (le("customers", 2) && hi("customers")) w.push("w_customers");
  if (le("outdoors", 2) && hi("outdoors", 60)) w.push("w_outdoors");
  if (ge("outdoors", 4) && lo("outdoors", 15)) w.push("w_indoors");
  if ((le("physical", 2) || out.has("standing")) && hi("standing", 65)) w.push("w_standing");
  if ((ge("physical", 4) || out.has("screen")) && hi("sitting", 70)) w.push("w_sitting");
  if ((le("physical", 2) || out.has("lifting") || out.has("bending")) && hi("hands", 70)) w.push("w_hands");
  if (out.has("weather") && hi("outdoors", 60) && !w.includes("w_outdoors")) w.push("w_outdoors");
  if (out.has("phone") && hi("phone", 88)) w.push("w_phone");
  if (out.has("upset") && hi("customers") && !w.includes("w_customers")) w.push("w_customers");
  if (out.has("alone") && lo("contact", 55) && !w.includes("w_alone")) w.push("w_alone");
  if (
    (out.has("nights") ||
      out.has("earlylate") ||
      out.has("weekends") ||
      out.has("oncall") ||
      ge("hours", 4)) &&
    hi("irregular", 50)
  )
    w.push("w_irregular");
  if (out.has("driving") && hi("vehicle", 50)) w.push("w_vehicle");
  if (out.has("nolicence") && hi("vehicle", 75)) w.push("w_licence");
  if (out.has("samework") && hi("routine", 75)) w.push("w_routine");
  if (ge("variety", 4) && hi("routine", 75) && !w.includes("w_routine")) w.push("w_routine");
  /* from O*NET's static strength (40 = between pushing a cart and pulling a 40-pound sack), high places
     (50 = about once a month) and noise or contaminants (75 = about once a week) */
  if ((le("physical", 1) || out.has("lifting")) && hi("strength", 40)) w.push("w_lifting");
  if (out.has("heights") && hi("heights", 50)) w.push("w_heights");
  if (out.has("noise") && hi("noise", 75)) w.push("w_noise");
  return w;
}
export const zoneOf = (O: Onet | null, i: number): Zone | null => (O?.z?.[i] as Zone) || null;
export const quality = (O: Onet | null, i: number): 0 | 1 | null => O?.q?.[i] ?? null;

/* ---------- what a job is about ---------- */
const DF = new WeakMap<object, Uint16Array>();
function skDF(E: Esco): Uint16Array {
  let df = DF.get(E.g);
  if (!df) {
    df = new Uint16Array(E.g.k.length);
    for (const e of E.g.e) for (const s of e) df[s]++;
    DF.set(E.g, df);
  }
  return df;
}
/* rare skills say more about a job than common ones: weight each skill by how few jobs list it */
const skW = (E: Esco, x: number) => Math.log(E.g.e.length / Math.max(1, skDF(E)[x]));
type Weights = Map<number, number> & { norm?: number };
const WCACHE = new WeakMap<object, Map<number, Weights>>();
function occW(E: Esco, i: number): Weights {
  let byOcc = WCACHE.get(E.g);
  if (!byOcc) WCACHE.set(E.g, (byOcc = new Map()));
  let w = byOcc.get(i);
  if (!w) {
    w = new Map() as Weights;
    E.g.e[i].forEach((x) => w!.set(x, skW(E, x)));
    let n = 0;
    w.forEach((v) => (n += v * v));
    w.norm = Math.sqrt(n) || 1;
    byOcc.set(i, w);
  }
  return w;
}
export function occSim(E: Esco, a: number, b: number): number {
  if (a === b) return 1;
  const A = occW(E, a),
    B = occW(E, b);
  let d = 0;
  const [s, l] = A.size < B.size ? [A, B] : [B, A];
  s.forEach((v, x) => {
    if (l.has(x)) d += v * v;
  });
  return d / (A.norm! * B.norm!);
}
/** The skills that describe a job's kind of work: rare, but shared with a few related jobs. */
export function distinct(E: Esco, i: number, n = 3): number[] {
  const df = skDF(E);
  const e = E.g.e[i];
  const sk = e.filter((x) => !E.g.k[x]);
  const pool = sk.length >= n ? sk : e;
  const fam = pool.filter((x) => df[x] >= 2);
  return (fam.length >= n ? fam : pool)
    .slice()
    .sort((a, b) => df[a] - df[b])
    .slice(0, n);
}

/* ---------- reactions: thumbs on jobs and on single skills ---------- */
export const voteOf = (d: Doc, i: number): Vote | null => d.esco.votes.find((v) => v.o === i) || null;
/** Mutates a draft. */
export function setVote(d: Doc, i: number, dir: 1 | 0 | -1): Vote {
  let v = d.esco.votes.find((x) => x.o === i);
  if (!v) {
    v = { o: i, d: dir, sk: [], ctx: [] };
    d.esco.votes.push(v);
    return d.esco.votes[d.esco.votes.length - 1];
  }
  v.d = dir;
  return v;
}
/** Mutates a draft. */
export function setSkillVote(d: Doc, i: number, x: number, dir: 1 | 0 | -1): void {
  const v = d.esco.votes.find((y) => y.o === i) || setVote(d, i, 0);
  v.sk = v.sk.filter((s) => s[0] !== x);
  if (dir) v.sk.push([x, dir]);
}
export function skillVote(d: Doc, i: number, x: number): 1 | 0 | -1 {
  const s = voteOf(d, i)?.sk.find((y) => y[0] === x);
  return s ? s[1] : 0;
}

/* a ticked skill counts by what it is about: its rare words, matched in every job's skill names
   (English, so both languages behave the same) */
interface Stems {
  words: string[][];
  df: Map<string, number>;
  occ: Map<number, string[][]>;
}
const STEMS = new WeakMap<object, Stems>();
const stemW = (w: string) => w.replace(/(ings?|ers?|es|ed|s|e)$/, "");
function stems(E: Esco): Stems {
  let s = STEMS.get(E.g);
  if (!s) {
    const L = (E.en || E.lab).sk;
    const df = new Map<string, number>();
    const words = L.map((l) => {
      const st = [
        ...new Set(
          String(l)
            .toLowerCase()
            .split(/[^a-z]+/)
            .filter((w) => w.length > 3)
            .map(stemW),
        ),
      ];
      st.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
      return st;
    });
    s = { words, df, occ: new Map() };
    STEMS.set(E.g, s);
  }
  return s;
}
function keyStems(E: Esco, x: number): string[] {
  const S = stems(E);
  const st = (S.words[x] || []).slice().sort((a, b) => S.df.get(a)! - S.df.get(b)!);
  const rare = st.filter((t) => S.df.get(t)! <= 150);
  return (rare.length ? rare : st).slice(0, 2);
}
function occStems(E: Esco, i: number): string[][] {
  const S = stems(E);
  let m = S.occ.get(i);
  if (!m) {
    m = E.g.e[i].concat(E.g.o[i]).map((x) => S.words[x] || []);
    S.occ.set(i, m);
  }
  return m;
}
function skMatch(E: Esco, i: number, x: number): number {
  const keys = keyStems(E, x);
  if (!keys.length) return 0;
  let n = 0;
  occStems(E, i).forEach((st) => {
    if (keys.some((k) => st.includes(k))) n++;
  });
  return Math.min(1, n / 2);
}

export interface Idea {
  /** occupation index */
  i: number;
  /** interest fit 0..1, or null without interests or O*NET data */
  fit: number | null;
  cov: Coverage | null;
  /** ranked on skills only (no interest data) */
  skillOnly: boolean;
  score: number;
  /** score before reactions */
  base: number;
  /** share of skills shared with the person's goals and shortlist */
  near?: number;
  /** similarity to a liked job, and which */
  like?: number;
  likeOf?: number;
  wantUp?: number[];
  wantDn?: number[];
  /** why an explore option (lens) brought it up */
  why?: Why;
}
/** Why a job came up in one of the explore options (see lenses.ts). */
export type Why =
  | { k: "skills"; n: number; x: number[] }
  | { k: "path"; from: string }
  | { k: "hobby"; words: string; x: number }
  | { k: "step"; x: SkillRef[] }
  | { k: "love"; x: number[] }
  | { k: "day"; x: string[] }
  | { k: "wild"; x: InterestId[] };

function voteAdjust(E: Esco, O: Onet | null, r: Idea, V: Vote[]) {
  r.base = r.score;
  if (!V.length) return;
  const e = new Set(E.g.e[r.i]);
  let adj = 0,
    skUp = 0,
    skDown = 0;
  V.forEach((v) => {
    if (v.d > 0) {
      const sim = occSim(E, r.i, v.o) * (v.sk.length ? 0.5 : 1);
      if (sim > (r.like || 0)) {
        r.like = sim;
        r.likeOf = v.o;
      }
    }
    v.sk.forEach(([x, dd]) => {
      const m = e.has(x) ? 1 : skMatch(E, r.i, x);
      if (m) {
        if (dd > 0) skUp += 0.2 * m;
        else skDown += 0.3 * m;
      }
    });
    (v.ctx || []).forEach(([k, dd]) => {
      const c = ctx(O, r.i, k);
      if (c != null) {
        const f = Math.max(0, (c - 50) / 50);
        adj += dd > 0 ? 0.2 * f : -0.3 * f;
      }
    });
  });
  if (r.like) adj += 0.5 * r.like;
  adj += Math.min(0.6, skUp) - Math.min(0.85, skDown);
  r.score += adj;
}
/* skills the person wants to use more (or less) in the next job lift (or lower) jobs built on them */
function wantAdjust(E: Esco, r: Idea, WU: number[], WD: number[]) {
  if (!WU.length && !WD.length) return;
  const own = occW(E, r.i);
  let up = 0,
    dn = 0;
  r.wantUp = [];
  r.wantDn = [];
  WU.forEach((x) => {
    const m = own.has(x) ? 1 : skMatch(E, r.i, x) * 0.5;
    if (m) {
      up += 0.12 * m;
      if (m >= 0.5) r.wantUp!.push(x);
    }
  });
  WD.forEach((x) => {
    const m = own.has(x) ? 1 : skMatch(E, r.i, x) * 0.5;
    if (m) {
      dn += 0.2 * m;
      if (m >= 0.5) r.wantDn!.push(x);
    }
  });
  r.score += Math.min(0.4, up) - Math.min(0.6, dn);
}

/* the body: the "at a desk ↔ on my feet" scale against how physical the job is (standing, bending and
   kneeling, static strength from O*NET), and a step down for each physical thing the person ruled out that the
   job has (the same limits as the warnings) */
const BODY_OUT: [string, ContextKey, number][] = [
  ["lifting", "strength", 40],
  ["bending", "hands", 70],
  ["standing", "standing", 65],
  ["heights", "heights", 50],
  ["noise", "noise", 75],
  ["weather", "outdoors", 60],
];
/** How physical a job is, 0..1: the mean of standing, bending and kneeling, and strength. Null without data. */
export function physicalOf(O: Onet | null, i: number): number | null {
  const v = (["standing", "hands", "strength"] as const).map((k) => ctx(O, i, k)).filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length / 100 : null;
}
function bodyAdjust(O: Onet | null, r: Idea, want: number | undefined, out: Set<string>) {
  const p = physicalOf(O, r.i);
  if (want && want !== 3 && p != null)
    r.score -= 0.3 * Math.abs((want - 1) / 4 - p) * (Math.abs(want - 3) / 2);
  BODY_OUT.forEach(([id, k, t]) => {
    const c = ctx(O, r.i, k);
    if (out.has(id) && c != null && c >= t) r.score -= 0.6;
  });
}

const hasRatings = (d: Doc) => Object.values(d.esco.rated).some((l) => l > 0);
/** Ideas need interests (part 2) or rated skills (part 6). */
export const canRank = (d: Doc): boolean => !!userInterests(d) || hasRatings(d);

/** Ready now: little preparation (level 1 or 2) and at least half the core skills had. */
export function isReady(O: Onet | null, i: number, cov: Coverage | null): boolean {
  const z = zoneOf(O, i);
  return z != null && z <= 2 && !!cov && cov.have.length * 2 >= cov.have.length + cov.miss.length;
}

/** Every occupation worth suggesting, best first. zone limits to a preparation level (1..4), or with READY to
 *  jobs the person could apply for now. */
export function rankAll(d: Doc, E: Esco, O: Onet | null, zone?: DeckFilter): Idea[] {
  const st = d.esco;
  const u = userInterests(d);
  const rated = hasRatings(d);
  const V = st.votes;
  const chosen = new Set(d.jobs.map((j) => j.occ));
  const hidden = new Set((st.hidden || []).concat(V.filter((v) => v.d < 0).map((v) => v.o)));
  const want = st.want || {};
  const WU = Object.keys(want)
    .filter((x) => want[x] === 1)
    .map(Number);
  const WD = Object.keys(want)
    .filter((x) => want[x] === -1)
    .map(Number);
  const a = assessOf(d);
  const out = new Set(a.ruledOut);
  const rows: Idea[] = [];
  let maxCov = 0;
  const goalSk = new Set<number>();
  jobsIn(d, "goal")
    .concat(jobsIn(d, "maybe"))
    .filter((j) => j.occ != null && j.occ >= 0)
    .forEach((j) => E.g.e[j.occ!].forEach((x) => goalSk.add(x)));
  E.g.e.forEach((ess, i) => {
    if (chosen.has(i) || hidden.has(i) || ess.length < 3) return;
    if (zone && zone !== READY && zoneOf(O, i) !== zone) return;
    const fit = u ? interestFit(O, i, u) : null;
    const cov = rated ? coverage(d, E, i) : null;
    if (zone === READY && !isReady(O, i, cov)) return;
    if (fit == null && !(cov && cov.have.length >= 2)) return;
    if (cov && cov.score > maxCov) maxCov = cov.score;
    rows.push({ i, fit, cov, skillOnly: fit == null, score: 0, base: 0 });
  });
  rows.forEach((r) => {
    const c = r.cov && maxCov ? r.cov.score / maxCov : 0;
    r.score =
      r.fit != null && rated
        ? r.fit * 0.6 + c * 0.4
        : r.fit != null
          ? r.fit
          : r.cov!.score * Math.min(1, r.cov!.have.length / 3);
    if (r.fit != null && quality(O, r.i) === 0) r.score -= 0.04;
    if (goalSk.size) {
      const e = E.g.e[r.i];
      r.near = e.filter((x) => goalSk.has(x)).length / e.length;
      r.score += r.near * 0.2;
    }
    bodyAdjust(O, r, a.setting.physical, out);
    voteAdjust(E, O, r, V);
    wantAdjust(E, r, WU, WD);
  });
  return rows.sort((a, b) => b.score - a.score);
}
export const fitBand = (s: number, skillOnly: boolean): FitBand =>
  skillOnly
    ? s >= 0.5
      ? 3
      : s >= 0.33
        ? 2
        : s >= 0.15
          ? 1
          : 0
    : s >= 0.82
      ? 3
      : s >= 0.7
        ? 2
        : s >= 0.55
          ? 1
          : 0;
/** The fit of any occupation, for cards of saved jobs too. */
export function fitOf(d: Doc, E: Esco, O: Onet | null, i: number): FitBand | null {
  const u = userInterests(d);
  const f = u ? interestFit(O, i, u) : null;
  if (f != null) return fitBand(f, false);
  if (!hasRatings(d)) return null;
  return fitBand(coverage(d, E, i).score, true);
}
