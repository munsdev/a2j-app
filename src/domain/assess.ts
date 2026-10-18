import type { Assess, Doc, Lang, PartKey } from "@/data/types";
import { APTITUDES, APT_ITEMS, INTERESTS, INT_ITEMS, type AptGroup, type InterestId } from "./items";

/* =================== THE SELF-ASSESSMENT ===================
   Six parts: 1 How you work (aptitudes), 2 What you enjoy (interests), 3 Where you want to work (setting),
   4 What matters (values), 5 Your story (jobs), 6 Your skills (cards). Scores are averages of 1..5 answers,
   rounded to halves; a score needs at least two of an aptitude's three answers. */

export const PARTS: readonly PartKey[] = ["apt", "int", "set", "val", "story", "skills"];

/** The assessment record with every bucket present (read-only use). */
export function assessOf(d: Doc): Required<Assess> {
  const a = d.assess || {};
  return {
    answers: a.answers || {},
    adjusted: a.adjusted || {},
    setting: a.setting || {},
    ruledOut: a.ruledOut || [],
    values: a.values || [],
    done: a.done || {},
  };
}
/** Fill the empty buckets on a draft, so they can be written to. */
export function ensureAssess(d: Doc): Required<Assess> {
  const a = d.assess;
  a.answers ??= {};
  a.adjusted ??= {};
  a.setting ??= {};
  a.ruledOut ??= [];
  a.values ??= [];
  a.done ??= {};
  return a as Required<Assess>;
}

export function rawScore(d: Doc, id: string): number | null {
  const ans = assessOf(d).answers;
  const vals = [1, 2, 3].map((k) => ans[id + "_" + k]).filter((v) => v >= 1 && v <= 5);
  if (vals.length < 2) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2;
}
export function aptScore(d: Doc, id: string): number | null {
  const adj = assessOf(d).adjusted[id];
  return adj >= 1 ? adj : rawScore(d, id);
}
export const intScore = (d: Doc, id: string): number | null => rawScore(d, id);

export interface ScoreRow {
  id: string;
  /** position in the list of aptitudes or interests */
  i: number;
  name: string;
  desc: string;
  score: number;
}
export function aptResults(d: Doc, lang: Lang): (ScoreRow & { g: AptGroup["id"] })[] {
  return APTITUDES.map((a, i) => ({
    id: a.id,
    i,
    g: a.g,
    name: a[lang][0],
    desc: a[lang][1],
    score: aptScore(d, a.id),
  })).filter((r): r is ScoreRow & { g: AptGroup["id"] } => r.score != null);
}
export function intResults(d: Doc, lang: Lang): (ScoreRow & { id: InterestId })[] {
  return INTERESTS.map((t, i) => ({
    id: t.id,
    i,
    name: t[lang][0],
    desc: t[lang][1],
    score: intScore(d, t.id),
  })).filter((r): r is ScoreRow & { id: InterestId } => r.score != null);
}
/** The aptitudes that stand out: the top five or so, at least "sometimes", at most seven. */
export function strongest(d: Doc, lang: Lang): ScoreRow[] {
  const r = aptResults(d, lang).sort((a, b) => b.score - a.score || a.i - b.i);
  if (!r.length) return [];
  const cut = (r[Math.min(4, r.length - 1)] || r[0]).score;
  let list = r.filter((x) => x.score >= cut && x.score >= 3);
  if (list.length > 7) {
    const hi = r.filter((x) => x.score > cut);
    list = hi.length >= 3 ? hi : list.slice(0, 7);
  }
  return list;
}
/** The three strongest interest types. */
export const interestCode = (d: Doc, lang: Lang) =>
  intResults(d, lang)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, 3);

/** Five bands for a 1..5 score. */
export const band = (s: number): 0 | 1 | 2 | 3 | 4 =>
  s < 1.75 ? 0 : s < 2.5 ? 1 : s < 3.25 ? 2 : s < 4.25 ? 3 : 4;

export interface PartStatus {
  /** answered (questions) or rated (skills) */
  n?: number;
  /** total questions */
  t?: number;
  done: boolean;
}
export function partStatus(d: Doc, k: PartKey): PartStatus {
  const a = assessOf(d);
  if (k === "apt" || k === "int") {
    const items = k === "apt" ? APT_ITEMS : INT_ITEMS;
    return { n: items.filter((x) => a.answers[x.id]).length, t: items.length, done: !!a.done[k] };
  }
  if (k === "skills")
    return { n: Object.keys(d.esco.rated).length + d.esco.own.length, done: !!a.done.skills };
  return { done: !!a.done[k] };
}
export const partsDone = (d: Doc): number => PARTS.filter((k) => partStatus(d, k).done).length;
export const nextPart = (d: Doc): PartKey | null => PARTS.find((k) => !partStatus(d, k).done) ?? null;

/** The person's six interest scores, R I A S E C, when at least four are known (missing ones count as 3). */
export function userInterests(d: Doc): number[] | null {
  const r = INTERESTS.map((t) => intScore(d, t.id));
  return r.filter((v) => v != null).length >= 4 ? r.map((v) => (v == null ? 3 : v)) : null;
}
