import type { Doc } from "@/data/types";
import { PARTS } from "@/domain/assess";
import { normTxt } from "@/domain/catalog";
import { hasOwnData } from "@/data/doc";

/* Pure helpers for backups: what goes into the file, what is in a file, and whether a text is one. */

/** The backup file: the document without the sample marker, with the date it was saved (YYYY-MM-DD). */
export function exportDoc(d: Doc, now: Date = new Date()): string {
  const out: Record<string, unknown> = { ...structuredClone(d), app: "a2j", version: 2 };
  delete out.example;
  out.saved = now.toISOString().slice(0, 10);
  return JSON.stringify(out, null, 2);
}

/** The file name for a backup: a2j-<name>-<date>-<time>.json, the name in plain lower-case letters and the
 *  local time it was saved, so several backups sort by date and none overwrites another. */
export function backupName(name: string, now: Date = new Date()): string {
  /* the catalogue's search folding: lower case, no accents, ß as ss, words split on anything else */
  const slug = normTxt(name).replace(/ /g, "-");
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`;
  return `a2j-${slug || "profile"}-${stamp}.json`;
}

/** Whether there is a backup to make: something entered (or a sample open), and a name for the file. */
export type BackupBlock = "empty" | "name" | null;
export function backupBlock(d: Doc): BackupBlock {
  if (!(hasOwnData(d) || d.example)) return "empty";
  return normTxt(d.profile.name) ? null : "name";
}

export type CountKey = "bk_n_parts" | "bk_n_jobs" | "bk_n_skills" | "bk_n_courses" | "bk_n_ads";
export interface Count {
  key: CountKey;
  n: number;
}

/* the same check as in data/doc.ts, which keeps its own private */
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const len = (v: unknown): number => (Array.isArray(v) ? v.length : 0);

/** What a document (or a backup that is not shaped yet) holds, part by part; empty parts are left out. */
export function docCounts(d: unknown): Count[] {
  const o = isObj(d) ? d : {};
  const assess = isObj(o.assess) ? o.assess : {};
  const done = isObj(assess.done) ? assess.done : {};
  const esco = isObj(o.esco) ? o.esco : {};
  const rated = isObj(esco.rated) ? Object.keys(esco.rated).length : 0;
  const all: Count[] = [
    { key: "bk_n_parts", n: PARTS.filter((k) => done[k]).length },
    { key: "bk_n_jobs", n: len(o.jobs) },
    { key: "bk_n_skills", n: rated },
    { key: "bk_n_courses", n: len(o.courses) },
    { key: "bk_n_ads", n: len(o.jobads) },
  ];
  return all.filter((c) => c.n > 0);
}

export type BackupCheck =
  { ok: true; doc: Record<string, unknown> } | { ok: false; error: "bk_bad" | "bk_old" };

/** Is this text a backup this app can open? Only "a2j" files of format version 2 are. Files of the first
 *  version (app "chart-my-skills", or "a2j" with another version) are refused as too old. */
export function checkBackup(text: unknown): BackupCheck {
  let d: unknown = null;
  try {
    d = JSON.parse(String(text ?? "").trim());
  } catch {
    /* not JSON */
  }
  if (!isObj(d) || (d.app !== "a2j" && d.app !== "chart-my-skills")) return { ok: false, error: "bk_bad" };
  if (d.app !== "a2j" || d.version !== 2) return { ok: false, error: "bk_old" };
  return { ok: true, doc: d };
}
