import type { Course, Doc, Job, JobAd } from "./types";

/* =================== DUPLICATES ===================
   Strict on purpose: a false alarm annoys faster than a missed duplicate helps. Two courses (or job ads) are
   the same when they have the same link, or the same name and the same provider (employer), or the same name
   where one of them has no provider. Two jobs are the same when they are the same catalogue occupation or have
   the same title; only goals and the shortlist count, since past jobs can rightly repeat.
   Merging keeps one record: the fields the person picked, the covered skills and linked jobs of both, and
   everything that pointed at the other (routes, courses, job ads) now pointing at it. Pure; the changing
   helpers take a draft. */

export type ItemKind = "course" | "jobad";
export type DupeKind = ItemKind | "job";

/** A name for comparing: lower case, no accents, "&" as "and", no punctuation, single spaces. */
export const normName = (s: unknown): string =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** A link for comparing: no scheme, no www., no #part, no trailing slash, host in lower case. */
export function normUrl(u: unknown): string {
  const s = String(u ?? "")
    .trim()
    .replace(/#.*$/, "");
  if (!s) return "";
  const m = /^(?:https?:\/\/)?(?:www\.)?([^/?]+)(.*)$/i.exec(s);
  if (!m) return s.toLowerCase();
  return (m[1].toLowerCase() + m[2]).replace(/\/+(\?|$)/, "$1");
}

const sameText = (a: unknown, b: unknown) => !!normName(a) && normName(a) === normName(b);
/** Both say the same, or one says nothing. */
const fits = (a: unknown, b: unknown) => !normName(a) || !normName(b) || normName(a) === normName(b);

interface ItemLike {
  name?: string;
  url?: string;
  provider?: string;
  org?: string;
}
/** Whether two courses or job ads are the same one. */
export function sameItem(kind: ItemKind, a: ItemLike, b: ItemLike): boolean {
  const ua = normUrl(a.url);
  if (ua && ua === normUrl(b.url)) return true;
  const who = kind === "course" ? "provider" : "org";
  return sameText(a.name, b.name) && fits(a[who], b[who]);
}

/** The saved course or job ad a new one matches, if any. */
export function itemMatch(
  kind: ItemKind,
  list: readonly (Course | JobAd)[],
  x: ItemLike,
  exceptId?: string | null,
): Course | JobAd | null {
  return list.find((y) => y.id !== exceptId && sameItem(kind, y as ItemLike, x)) ?? null;
}

const aimed = (j: Job) => j.role === "goal" || j.role === "maybe";
export const sameJob = (a: Pick<Job, "title" | "occ">, b: Pick<Job, "title" | "occ">): boolean =>
  ((a.occ ?? -1) >= 0 && a.occ === b.occ) || sameText(a.title, b.title);

/** The goal or shortlisted job a new one matches, if any. */
export const jobMatch = (d: Doc, x: Pick<Job, "title" | "occ">, exceptId?: string | null): Job | null =>
  d.jobs.find((j) => j.id !== exceptId && aimed(j) && sameJob(j, x)) ?? null;

/* ---------- comparing fields ---------- */
export interface FieldDiff {
  k: string;
  saved: string;
  other: string;
  /** which to keep unless the person picks: the saved value, or the other when nothing was saved */
  pick: "saved" | "other";
}
const txt = (v: unknown) => (v == null ? "" : String(v).trim());
/** The fields where the other record says something different from the saved one. A field the other leaves
 *  empty is not a difference (the saved value stays). same: how many fields read the same. */
export function fieldDiffs(
  keys: readonly string[],
  saved: Record<string, unknown>,
  other: Record<string, unknown>,
): { diffs: FieldDiff[]; same: number } {
  const diffs: FieldDiff[] = [];
  let same = 0;
  for (const k of keys) {
    const a = txt(saved[k]);
    const b = txt(other[k]);
    if (!b) continue;
    if (a === b) same++;
    else diffs.push({ k, saved: a, other: b, pick: a ? "saved" : "other" });
  }
  return { diffs, same };
}

/* ---------- merging ---------- */
const union = <T>(a: readonly T[], b: readonly T[], key: (x: T) => string = String): T[] => {
  const out = [...a];
  b.forEach((x) => !out.some((y) => key(y) === key(x)) && out.push(x));
  return out;
};

/** Merge into a saved course or job ad: the chosen field values (empty removes), and the covered skills and
 *  linked jobs of the other. dropId: the other one, when it is saved too (the cleanup); it goes, and routes
 *  that used it use the kept one. Mutates. */
export function mergeItem(
  d: Doc,
  kind: ItemKind,
  keepId: string,
  values: Record<string, string>,
  extra: { goals?: readonly string[]; covers?: readonly (number | string)[] },
  dropId?: string | null,
): void {
  const list = (kind === "course" ? d.courses : d.jobads) as (Course | JobAd)[];
  const keep = list.find((x) => x.id === keepId) as Record<string, unknown> & (Course | JobAd);
  if (!keep) return;
  const drop = dropId ? list.find((x) => x.id === dropId) : undefined;
  for (const [k, v] of Object.entries(values)) {
    if (v) keep[k] = v;
    else delete keep[k];
  }
  keep.goals = union(keep.goals, [...(extra.goals ?? []), ...(drop?.goals ?? [])]);
  if ("covers" in keep) {
    const covers = [...(extra.covers ?? []), ...((drop as Course | undefined)?.covers ?? [])];
    const kc = keep as Course;
    kc.covers = union(kc.covers, covers, (x) => (typeof x === "number" ? "s" + x : "n:" + normName(x)));
  }
  if (!drop) return;
  if (kind === "course") {
    d.courses = d.courses.filter((x) => x.id !== dropId);
    d.routes.forEach((r) => r.course === dropId && (r.course = keepId));
  } else d.jobads = d.jobads.filter((x) => x.id !== dropId);
}

/** Merge two saved jobs into one: the title picked, and whatever pointed at the other (courses, job ads,
 *  routes) now points at the kept one. A goal stays a goal. Mutates. */
export function mergeJobs(d: Doc, keepId: string, dropId: string, title?: string): void {
  const keep = d.jobs.find((j) => j.id === keepId);
  const drop = d.jobs.find((j) => j.id === dropId);
  if (!keep || !drop) return;
  if (title) keep.title = title;
  if ((keep.occ ?? -1) < 0 && (drop.occ ?? -1) >= 0) {
    keep.occ = drop.occ;
    keep.auto = drop.auto;
  }
  if (drop.role === "goal") keep.role = "goal";
  keep.extra = union(keep.extra ?? [], drop.extra ?? []);
  if (!keep.extra.length) delete keep.extra;
  const swap = (goals: string[]) =>
    union(
      goals.filter((g) => g !== dropId),
      goals.includes(dropId) ? [keepId] : [],
    );
  d.courses.forEach((c) => (c.goals = swap(c.goals)));
  d.jobads.forEach((a) => (a.goals = swap(a.goals)));
  d.routes.forEach((r) => r.job === dropId && (r.job = keepId));
  if (d.mainGoal === dropId) d.mainGoal = keepId;
  d.jobs = d.jobs.filter((j) => j.id !== dropId);
}

/* ---------- the cleanup check ---------- */
export interface DupePair {
  kind: DupeKind;
  a: string;
  b: string;
}
const NOT = "notDupes";
const pairKey = (p: DupePair) => [p.kind, ...[p.a, p.b].sort()].join(":");
const dismissed = (d: Doc): string[] => {
  const v = d.seen?.[NOT];
  return Array.isArray(v) ? (v as string[]) : [];
};

/** Saved records that look like the same one, except pairs the person said are different. */
export function dupePairs(d: Doc): DupePair[] {
  const out: DupePair[] = [];
  const no = new Set(dismissed(d));
  const scan = <T extends { id: string }>(
    kind: DupeKind,
    list: readonly T[],
    same: (a: T, b: T) => boolean,
  ) =>
    list.forEach((a, i) =>
      list.slice(i + 1).forEach((b) => {
        const p = { kind, a: a.id, b: b.id };
        if (same(a, b) && !no.has(pairKey(p))) out.push(p);
      }),
    );
  scan("course", d.courses, (a, b) => sameItem("course", a, b));
  scan("jobad", d.jobads, (a, b) => sameItem("jobad", a, b));
  scan("job", d.jobs.filter(aimed), sameJob);
  return out;
}

/** "These are different": the pair is not asked about again. Mutates. */
export function notDupe(d: Doc, p: DupePair): void {
  d.seen = { ...d.seen, [NOT]: [...new Set([...dismissed(d), pairKey(p)])] };
}
