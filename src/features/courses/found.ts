import type { Draft } from "immer";
import type { Course, Doc, Job, JobAd, SkillRef } from "@/data/types";
import { safeUrl, splitList, uid } from "@/data/doc";
import { normTxt, type Esco } from "@/domain/catalog";
import { jobTiles, skKey } from "@/domain/skills";
import { fillRouteCourse } from "@/data/routes";
import { itemMatch } from "@/data/dupes";
import { extractJSON, str, type Json } from "./parse";
import { finderCtx } from "./text";
import type { FinderSpec, ItemKind } from "./types";

/* From a pasted AI answer to saved courses or job ads. Pure, except keepFound, which changes a draft. */

export const COURSE_F = [
  "name",
  "provider",
  "url",
  "start",
  "length",
  "schedule",
  "format",
  "language",
  "price",
  "funding",
  "cert",
  "notes",
] as const satisfies readonly (keyof Course)[];
export const JOBAD_F = [
  "name",
  "org",
  "place",
  "url",
  "deadline",
  "hours",
  "pay",
  "reqs",
  "notes",
] as const satisfies readonly (keyof JobAd)[];
export type CourseField = (typeof COURSE_F)[number];
export type JobadField = (typeof JOBAD_F)[number];
export type TextField = CourseField | JobadField;
export const fieldsOf = (kind: ItemKind): readonly TextField[] => (kind === "course" ? COURSE_F : JOBAD_F);

/** One course or job ad read from an answer. */
export interface FoundItem {
  name: string;
  fields: Partial<Record<TextField, string>>;
  /** courses: what the page says about AZAV ("provider" = it says certified) */
  azav: "provider" | "no" | "";
  /** courses: the job's skills it covers, matched by exact name */
  covers: SkillRef[];
}

/** Read the courses (keys "courses" or "kurse") or job ads ("jobads", "jobs", "stellen") from an answer. */
export function readFound(d: Doc, E: Esco, F: FinderSpec, text: string): FoundItem[] {
  const data = extractJSON(text);
  const kind = F.kind;
  const keys = kind === "course" ? ["courses", "kurse"] : ["jobads", "jobs", "stellen"];
  let list: Json[] | null = null;
  if (data)
    Object.keys(data).forEach((k) => {
      const v = data[k];
      if (keys.includes(k.toLowerCase()) && Array.isArray(v)) list = v;
    });
  if (!list && data && data.name) list = [data];
  const c = finderCtx(d, E, F);
  /* skill names in both languages, as they appeared in the prompt */
  const byName = new Map<string, SkillRef>(c.tiles.map((t) => [normTxt(t.name), t.x]));
  const occ = c.job?.occ ?? -1;
  if (occ >= 0)
    for (const L of [E.de, E.en]) if (L) E.g.e[occ].forEach((x) => byName.set(normTxt(L.sk[x]), x));
  return ((list ?? []) as Json[])
    .filter(
      (x): x is { [k: string]: Json } => !!x && typeof x === "object" && !Array.isArray(x) && !!str(x.name),
    )
    .map((x) => {
      const o: FoundItem = { name: str(x.name), fields: {}, azav: "", covers: [] };
      fieldsOf(kind).forEach((k) => {
        if (k !== "name" && str(x[k])) o.fields[k] = str(x[k]);
      });
      if (kind === "course") {
        const az = str(x.azav);
        o.azav = /^(yes|ja|true)/i.test(az) ? "provider" : /^(no|nein|false)/i.test(az) ? "no" : "";
        const names = Array.isArray(x.covers) ? x.covers.map((n) => str(n)) : splitList(str(x.covers));
        names.forEach((n) => {
          const v = byName.get(normTxt(n));
          if (v != null && !o.covers.some((w) => skKey(w) === skKey(v))) o.covers.push(v);
        });
        if (F.skill != null && !o.covers.some((v) => skKey(v) === skKey(F.skill!))) o.covers.push(F.skill);
        if (str(x.note)) o.fields.notes = str(x.note);
      }
      if (o.fields.url && !safeUrl(o.fields.url)) delete o.fields.url;
      return o;
    });
}

/** One found item that matches a saved one: compared by the person before anything changes. */
export interface FoundMatch {
  savedId: string;
  item: FoundItem;
}

/** Save the chosen items. Those that match a saved one (the same link, or the same name and provider; see
 *  data/dupes.ts) are not saved: they come back as matches, for the person to compare. Returns the new ids. */
export function keepFound(
  d: Draft<Doc>,
  F: FinderSpec,
  items: readonly FoundItem[],
): { ids: string[]; matches: FoundMatch[] } {
  const ids: string[] = [];
  const matches: FoundMatch[] = [];
  items.forEach((x) => {
    const list = F.kind === "course" ? d.courses : d.jobads;
    const ex = itemMatch(F.kind, list, { name: x.name, ...x.fields });
    if (ex) matches.push({ savedId: ex.id, item: x });
    else ids.push(addFound(d, F, x));
  });
  return { ids, matches };
}

/** Save one found item as a new course or job ad (also "Keep both" after comparing). Returns its id. */
export function addFound(d: Draft<Doc>, F: FinderSpec, x: FoundItem): string {
  if (F.kind === "course") {
    const c: Course = {
      id: uid("c", d.courses),
      name: x.name,
      ...(x.fields as Partial<Record<CourseField, string>>),
      azav: x.azav,
      covers: [...x.covers],
      goals: F.job ? [F.job] : [],
      status: "interested",
      source: "ai",
    };
    d.courses.push(c);
    /* a route to this job without a course takes the first one saved */
    if (F.job) fillRouteCourse(d, c.id, F.job);
    return c.id;
  }
  const a: JobAd = {
    id: uid("a", d.jobads),
    name: x.name,
    ...(x.fields as Partial<Record<JobadField, string>>),
    goals: F.job ? [F.job] : [],
    status: "interested",
    source: "ai",
  };
  d.jobads.push(a);
  return a.id;
}

/** Other jobs (not done) that need a skill these courses cover and that not all of them count for yet. */
export function alsoCandidates(d: Doc, E: Esco | null, courseIds: readonly string[]): Job[] {
  const courses = d.courses.filter((c) => courseIds.includes(c.id));
  const keys = new Set(courses.flatMap((c) => c.covers.map(skKey)));
  if (!keys.size) return [];
  return d.jobs.filter(
    (j) =>
      j.role !== "done" &&
      (j.occ ?? -1) >= 0 &&
      !courses.every((c) => c.goals.includes(j.id)) &&
      jobTiles(d, E, j.occ, j).some((t) => keys.has(t.key)),
  );
}
