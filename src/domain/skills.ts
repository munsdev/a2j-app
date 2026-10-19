import type { Course, Doc, Job, SkillRef } from "@/data/types";
import { jobsIn, lc } from "@/data/doc";
import { courseForJob } from "@/data/routes";
import { type Esco, normTxt, searchOcc, searchSkillScored, skLabel } from "./catalog";

/* =================== SKILLS, RATINGS, COVERAGE ===================
   Ratings (0 to 5) are the only record of what someone can do. Skills typed in plain words are kept as own
   skills and linked to a catalogue skill when the match is clear. A job's skills are shown as tiles:
   have, the route's course covers it, still to learn. Only the course of the job's route counts: courses
   saved for other routes cover nothing here. */

/** From this level on a skill counts as "have" (half on coverage below level 3). */
export const LV_SOME = 1;

/** The level of a skill, or null when it was never rated. Own skills linked to a catalogue skill count too. */
export function level(d: Doc, x: SkillRef): number | null {
  const st = d.esco;
  if (typeof x === "string") {
    const o = st.own.find((s) => lc(s.name) === lc(x));
    return o ? o.level || 0 : null;
  }
  let l: number | null = st.rated[x] ?? null;
  st.own.forEach((o) => {
    if (o.esco === x && (o.level || 0) > (l || 0)) l = o.level || 0;
  });
  return l;
}
export const hasSkill = (d: Doc, x: SkillRef): boolean => (level(d, x) || 0) >= LV_SOME;

export interface Coverage {
  /** 0..1: level 3+ counts fully, level 1–2 half */
  score: number;
  have: number[];
  miss: number[];
}
export function coverage(d: Doc, E: Esco, occ: number): Coverage {
  const ess = E.g.e[occ] || [];
  if (!ess.length) return { score: 0, have: [], miss: [] };
  let sum = 0;
  const have: number[] = [];
  const miss: number[] = [];
  ess.forEach((s) => {
    const l = level(d, s) || 0;
    if (l >= 3) {
      sum += 1;
      have.push(s);
    } else if (l >= LV_SOME) {
      sum += 0.5;
      have.push(s);
    } else miss.push(s);
  });
  return { score: sum / ess.length, have, miss };
}

/** Match saved jobs to occupations once the catalogue is there. Mutates a draft; returns whether it changed. */
export function matchJobs(d: Doc, E: Esco): boolean {
  let changed = false;
  d.jobs.forEach((j) => {
    if (j.occ == null && j.title) {
      const m = searchOcc(E, j.title, 1);
      j.occ = m.length ? m[0] : -1;
      j.auto = true;
      changed = true;
    }
  });
  return changed;
}
export const needsMatching = (d: Doc): boolean => d.jobs.some((j) => j.occ == null && !!j.title);

/** Which done jobs a skill comes from: every done job whose occupation lists it (essential or optional). */
export function skillSources(d: Doc, E: Esco, x: SkillRef): string[] {
  if (typeof x === "string") return [];
  return jobsIn(d, "done")
    .filter((j) => j.occ != null && j.occ >= 0 && (E.g.e[j.occ].includes(x) || E.g.o[j.occ].includes(x)))
    .map((j) => j.title);
}

/* ---------- a job's skills as tiles ---------- */
export type TileState = "have" | "course" | "learn";
export interface Tile {
  x: SkillRef;
  key: string;
  name: string;
  state: TileState;
  /** the course that covers it (also on a skill you have: it teaches it again) */
  course: Course | null;
  /** you have it and the course teaches it again: the overlap */
  also: boolean;
  level: number;
  /** a need outside the catalogue */
  extra: boolean;
}
export const skKey = (x: SkillRef): string => (typeof x === "number" ? "s" + x : "n:" + lc(x));
export const skName = (E: Esco | null, x: SkillRef): string => (typeof x === "number" ? skLabel(E, x) : x);
/** A skill ref from a string (data attributes, form values): digits are a catalogue skill. */
export const toSkillRef = (raw: string): SkillRef => (/^\d+$/.test(raw) ? +raw : raw);

/** Courses that cover a skill, those saved for the given job first. */
export function coursesCovering(d: Doc, x: SkillRef, jobId?: string | null): Course[] {
  const k = skKey(x);
  return d.courses
    .filter((c) => c.covers.some((v) => skKey(v) === k))
    .sort((a, b) => (jobId && b.goals.includes(jobId) ? 1 : 0) - (jobId && a.goals.includes(jobId) ? 1 : 0));
}

const RANK: Record<TileState, number> = { have: 0, course: 1, learn: 2 };
/** A job's skills as tiles. course: the course to count (a route being compared or planned); left out, the
 *  course of the job's route. */
export function jobTiles(
  d: Doc,
  E: Esco | null,
  occ: number | null,
  job?: Job | null,
  course?: Course | null,
): Tile[] {
  const via = course === undefined ? courseForJob(d, job?.id) : course;
  const covered = new Set((via?.covers ?? []).map(skKey));
  const list: SkillRef[] = (occ != null && occ >= 0 && E ? E.g.e[occ] : []).slice();
  (job?.extra || []).forEach((n) => {
    if (!list.some((x) => skKey(x) === skKey(n))) list.push(n);
  });
  const tiles = list.map<Tile>((x) => {
    const have = (level(d, x) || 0) >= LV_SOME;
    const c = covered.has(skKey(x)) ? via : null;
    return {
      x,
      key: skKey(x),
      name: skName(E, x),
      state: have ? "have" : c ? "course" : "learn",
      course: c,
      also: have && !!c,
      level: level(d, x) || 0,
      extra: typeof x === "string",
    };
  });
  return tiles.sort((a, b) => RANK[a.state] - RANK[b.state]);
}
export interface JobCount {
  have: number;
  course: number;
  total: number;
  tiles: Tile[];
}
export function jobCount(
  d: Doc,
  E: Esco | null,
  occ: number | null,
  job?: Job | null,
  course?: Course | null,
): JobCount {
  const t = jobTiles(d, E, occ, job, course);
  return {
    have: t.filter((x) => x.state === "have").length,
    course: t.filter((x) => x.state === "course").length,
    total: t.length,
    tiles: t,
  };
}

/* ---------- the skill cards: skills of done jobs, one at a time ---------- */
export interface Deck {
  /** skill indexes still to rate, in order */
  cards: number[];
  /** skill → titles of the done jobs it comes from */
  from: Record<number, string[]>;
}
export function buildDeck(d: Doc, E: Esco): Deck {
  const seen = new Set<number>();
  const from: Record<number, string[]> = {};
  const cards: number[] = [];
  const jobs = jobsIn(d, "done").filter((j) => j.occ != null && j.occ >= 0);
  const add = (list: number[], j: Job) =>
    list.forEach((s) => {
      (from[s] = from[s] || []).push(j.title);
      if (!seen.has(s)) {
        seen.add(s);
        cards.push(s);
      }
    });
  jobs.forEach((j) => add(E.g.e[j.occ!], j));
  if (d.esco.more) jobs.forEach((j) => add(E.g.o[j.occ!], j));
  return { cards: cards.filter((s) => d.esco.rated[s] == null), from };
}

/** A skill typed in plain words: rate the catalogue skill when the words match it, otherwise keep it as an own
 *  skill. With linkTo, rate that catalogue skill. Mutates a draft. */
export function addOwnSkill(
  d: Doc,
  E: Esco,
  text: string,
  lvl = 3,
  linkTo?: number,
): { rated: number } | { own: string } | null {
  const t = String(text || "").trim();
  if (!t) return null;
  const st = d.esco;
  if (linkTo != null) {
    st.rated[linkTo] = Math.max(st.rated[linkTo] || 0, lvl);
    return { rated: linkTo };
  }
  const exact = searchSkillScored(E, t, 1)[0];
  if (exact && normTxt(E.lab.sk[exact[1]]) === normTxt(t)) {
    st.rated[exact[1]] = Math.max(st.rated[exact[1]] || 0, lvl);
    return { rated: exact[1] };
  }
  if (!st.own.some((o) => lc(o.name) === lc(t))) st.own.push({ name: t, level: lvl });
  return { own: t };
}
/** Set how well someone can do a skill. Mutates a draft. */
export function setLevel(d: Doc, x: SkillRef, n: number): void {
  if (typeof x === "number") {
    const own = d.esco.own.find((o) => o.esco === x);
    if (own) own.level = n;
    d.esco.rated[x] = n;
  } else {
    const o = d.esco.own.find((s) => lc(s.name) === lc(x));
    if (o) o.level = n;
    else d.esco.own.push({ name: x, level: n });
  }
}

/* ---------- search links: German labels, also in the English interface ---------- */
export const searchTerm = (s: string): string =>
  String(s || "")
    .split("/")[0]
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
export const courseLink = (t: string): string =>
  "https://mein-now.de/weiterbildungssuche/?sw=" + encodeURIComponent(searchTerm(t));
export const jobLink = (t: string, place?: string): string =>
  "https://www.arbeitsagentur.de/jobsuche/suche?angebotsart=1&was=" +
  encodeURIComponent(searchTerm(t)) +
  (place ? "&wo=" + encodeURIComponent(String(place).split(",")[0].trim()) + "&umkreis=25" : "");
