import type { Doc, Job, JobRole, Profile } from "./types";
import { PROFILE_KEYS } from "./types";

/* Pure helpers on the document. Functions that change it take an Immer draft (see store.ts). */

export function emptyProfile(): Profile {
  const p = {} as Record<string, unknown>;
  PROFILE_KEYS.forEach((k) => (p[k] = ""));
  p.coursePrefs = null;
  return p as unknown as Profile;
}

export function emptyDoc(): Doc {
  return {
    app: "a2j",
    version: 2,
    profile: emptyProfile(),
    jobs: [],
    mainGoal: null,
    esco: { rated: {}, own: [], want: {}, votes: [], hidden: [], more: false },
    assess: {},
    courses: [],
    jobads: [],
    summary: {},
    seen: {},
  };
}

/** The next free id with a prefix: j1, j2… */
export function uid(prefix: string, list: readonly { id: string }[]): string {
  const have = new Set(list.map((x) => x.id));
  let n = 1;
  while (have.has(prefix + n)) n++;
  return prefix + n;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Bring anything that claims to be a version 2 document into shape. Anything else becomes an empty document. */
export function shape(input: unknown): Doc {
  const e = emptyDoc();
  if (!isObj(input) || input.version !== 2) return e;
  const d = input as Partial<Doc>;
  const out: Doc = {
    ...e,
    ...d,
    app: "a2j",
    version: 2,
    profile: { ...e.profile, ...(isObj(d.profile) ? d.profile : {}) },
    esco: { ...e.esco, ...(isObj(d.esco) ? d.esco : {}) },
  } as Doc;
  for (const k of ["jobs", "courses", "jobads"] as const) if (!Array.isArray(out[k])) out[k] = [] as never;
  for (const k of ["assess", "summary", "seen"] as const) if (!isObj(out[k])) out[k] = {} as never;
  out.jobs = out.jobs.map((j) => ({ ...j }));
  out.jobs.forEach((j) => {
    if (!j.id) j.id = uid("j", out.jobs);
    if (!["done", "goal", "maybe"].includes(j.role)) j.role = "maybe";
    if (j.org == null) j.org = "";
    if (j.when == null) j.when = "";
    if (j.title == null) j.title = "";
  });
  out.courses = out.courses.map((c) => ({
    ...c,
    goals: Array.isArray(c.goals) ? c.goals : [],
    covers: Array.isArray(c.covers) ? c.covers : [],
  }));
  out.courses.forEach((c) => {
    if (!c.id) c.id = uid("c", out.courses);
  });
  out.jobads = out.jobads.map((a) => ({ ...a, goals: Array.isArray(a.goals) ? a.goals : [] }));
  out.jobads.forEach((a) => {
    if (!a.id) a.id = uid("a", out.jobads);
  });
  if (out.mainGoal && !out.jobs.some((j) => j.id === out.mainGoal && j.role === "goal")) out.mainGoal = null;
  if (out.mainGoal === undefined) out.mainGoal = null;
  /* older answers: "Shift work" became night shifts plus early or late shifts */
  const ro = out.assess.ruledOut;
  if (Array.isArray(ro) && ro.includes("shifts"))
    out.assess = {
      ...out.assess,
      ruledOut: [...new Set(ro.filter((x) => x !== "shifts").concat(["nights", "earlylate"]))],
    };
  return out;
}

/* ---------- something the person entered ---------- */
/** The assessment record fills with empty buckets on start, so look inside them. */
export const filled = (v: unknown): boolean =>
  Array.isArray(v)
    ? v.length > 0
    : isObj(v)
      ? Object.values(v).some(filled)
      : v != null && v !== "" && v !== false;

export const hasOwnData = (d: Doc): boolean =>
  !d.example &&
  !!(
    d.jobs.length ||
    d.courses.length ||
    d.jobads.length ||
    d.esco.own.length ||
    PROFILE_KEYS.some((k) => filled(d.profile[k])) ||
    filled(d.assess) ||
    Object.keys(d.esco.rated).length
  );

/* ---------- jobs ---------- */
export const jobById = (d: Doc, id: string | null | undefined): Job | null =>
  (id && d.jobs.find((j) => j.id === id)) || null;
export const jobsIn = (d: Doc, role: JobRole): Job[] => d.jobs.filter((j) => j.role === role);
export function mainGoal(d: Doc): Job | null {
  const g = jobsIn(d, "goal");
  return g.find((j) => j.id === d.mainGoal) || g[0] || null;
}
/** The job saved for a catalogue occupation, if any. */
export const jobForOcc = (d: Doc, occ: number): Job | null =>
  d.jobs.find((j) => j.occ === occ && (j.occ ?? -1) >= 0) || null;

export function addJob(d: Doc, o: Partial<Job>): Job {
  const j: Job = { id: uid("j", d.jobs), title: "", occ: null, role: "maybe", org: "", when: "", ...o };
  d.jobs.push(j);
  return j;
}
export function makeGoal(d: Doc, id: string): void {
  const j = d.jobs.find((x) => x.id === id);
  if (!j) return;
  j.role = "goal";
  if (!d.mainGoal || !jobById(d, d.mainGoal)) d.mainGoal = j.id;
}
export function removeJob(d: Doc, id: string): void {
  d.jobs = d.jobs.filter((x) => x.id !== id);
  d.courses.forEach((c) => (c.goals = c.goals.filter((g) => g !== id)));
  d.jobads.forEach((a) => (a.goals = a.goals.filter((g) => g !== id)));
  if (d.mainGoal === id) d.mainGoal = jobsIn(d, "goal")[0]?.id ?? null;
}

/* ---------- small text helpers ---------- */
export const lc = (s: unknown): string =>
  String(s == null ? "" : s)
    .trim()
    .toLowerCase();
export const splitList = (t: unknown): string[] =>
  String(t || "")
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
/** A link the person typed, made safe to open: http(s) only, a bare domain gets https://. */
export function safeUrl(u: unknown): string | null {
  const s = String(u || "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s)) return "https://" + s;
  return null;
}
