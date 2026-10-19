import type { Draft } from "immer";
import type { Course, Doc, Job, JobAd, SkillRef } from "@/data/types";
import { lc, safeUrl, splitList, uid } from "@/data/doc";
import { normTxt, type Esco } from "@/domain/catalog";
import { jobTiles, skKey } from "@/domain/skills";
import { fillRouteCourse } from "@/data/routes";
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

/** Save the chosen items, merging with saved ones of the same name and link. Returns their ids. */
export function keepFound(d: Draft<Doc>, F: FinderSpec, items: readonly FoundItem[]): string[] {
  const ids: string[] = [];
  if (F.kind === "course") {
    const list = d.courses;
    items.forEach((x) => {
      const url = x.fields.url || "";
      const ex = list.find((y) => lc(y.name) === lc(x.name) && lc(y.url || "") === lc(url));
      if (ex) {
        if (F.job && !ex.goals.includes(F.job)) ex.goals.push(F.job);
        x.covers.forEach((v) => {
          if (!ex.covers.some((w) => skKey(w) === skKey(v))) ex.covers.push(v);
        });
        ids.push(ex.id);
        return;
      }
      const c: Course = {
        id: uid("c", list),
        name: x.name,
        ...(x.fields as Partial<Record<CourseField, string>>),
        azav: x.azav,
        covers: [...x.covers],
        goals: F.job ? [F.job] : [],
        status: "interested",
        source: "ai",
      };
      list.push(c);
      ids.push(c.id);
    });
    /* a route to this job without a course takes the first one saved */
    if (F.job) ids.forEach((id) => fillRouteCourse(d, id, F.job!));
  } else {
    const list = d.jobads;
    items.forEach((x) => {
      const url = x.fields.url || "";
      const ex = list.find((y) => lc(y.name) === lc(x.name) && lc(y.url || "") === lc(url));
      if (ex) {
        if (F.job && !ex.goals.includes(F.job)) ex.goals.push(F.job);
        ids.push(ex.id);
        return;
      }
      const a: JobAd = {
        id: uid("a", list),
        name: x.name,
        ...(x.fields as Partial<Record<JobadField, string>>),
        goals: F.job ? [F.job] : [],
        status: "interested",
        source: "ai",
      };
      list.push(a);
      ids.push(a.id);
    });
  }
  return ids;
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
