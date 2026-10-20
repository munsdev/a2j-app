import type { Doc, Lang, PartKey } from "@/data/types";
import { jobById, mainGoal } from "@/data/doc";
import { PARTS, partStatus, type PartStatus } from "@/domain/assess";
import type { SettingRow } from "@/domain/items";
import { type Esco, normTxt, searchSkillScored } from "@/domain/catalog";

/* Pure helpers of the profile screen. No React, so they are unit-tested (logic.test.ts). */

/** Today as an ISO date (2026-10-18): the value of assess.done[part]. */
export const todayIso = (now = new Date()): string => now.toISOString().slice(0, 10);

/** A walk through the cards of a run: the order they come in (card numbers), where you are, and how long the
 *  first pass is. Cards skipped on the first pass come back once, one after another, at the end. */
export interface Walk {
  order: number[];
  pos: number;
  first: number;
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** The open cards in order; when every card is done (changing answers), all of them. */
export function startWalk(n: number, done: (i: number) => boolean): Walk {
  const open = range(n).filter((i) => !done(i));
  const order = open.length ? open : range(n);
  return { order, pos: 0, first: order.length };
}
/** The next card. After the first pass, the ones still open follow once; after those, finish. */
export function stepOn(w: Walk, done: (i: number) => boolean): Walk | "finish" {
  if (w.pos < w.order.length - 1) return { ...w, pos: w.pos + 1 };
  if (w.order.length === w.first) {
    const later = w.order.filter((i) => !done(i));
    if (later.length) return { ...w, order: [...w.order, ...later], pos: w.pos + 1 };
  }
  return "finish";
}
/** On the cards that were skipped: [this one, of how many]. Null on the first pass. */
export const laterStep = (w: Walk): [number, number] | null =>
  w.pos >= w.first ? [w.pos - w.first + 1, w.order.length - w.first] : null;

/** The part to suggest after finishing one: the next unfinished part after it, else the first unfinished. */
export function partAfter(d: Doc, k: PartKey): PartKey | null {
  const i = PARTS.indexOf(k);
  const open = (p: PartKey) => !partStatus(d, p).done;
  return PARTS.slice(i + 1).find(open) ?? PARTS.find(open) ?? null;
}

/** What a part card says: its status line and its button. */
export function partCardText(s: PartStatus): {
  status: "st_done" | "st_prog" | "st_todo";
  button: "b_redo" | "b_cont" | "b_start";
} {
  return {
    status: s.done ? "st_done" : s.t && s.n ? "st_prog" : "st_todo",
    button: s.done ? "b_redo" : s.n ? "b_cont" : "b_start",
  };
}

/** A scale end inside a sentence ("Rather indoors"): lower case in English; German keeps its capitals,
 *  since nouns are capitalised ("Lieber mit vielen Menschen"). */
export const midSentence = (s: string, lang: Lang): string => (lang === "en" ? s.toLowerCase() : s);

/** One work-setting preference for the results: "Clearly on my own", "Rather indoors". 3 (either) is left out. */
export interface SettingPref {
  id: SettingRow["id"];
  clearly: boolean;
  /** the end of the scale, written to sit mid-sentence */
  x: string;
}
export function settingPrefs(
  rows: readonly SettingRow[],
  setting: Record<string, number>,
  lang: Lang,
): SettingPref[] {
  return rows
    .filter((s) => setting[s.id] && setting[s.id] !== 3)
    .map((s) => {
      const v = setting[s.id];
      const l = s[lang];
      return { id: s.id, clearly: v === 1 || v === 5, x: midSentence(v < 3 ? l[0] : l[1], lang) };
    });
}

/** Tap a value: add it while fewer than max are picked, tap again to take it out. A pick beyond max is
 *  refused (the list comes back unchanged). Order is kept. */
export function togglePickWithinMax(list: readonly string[], id: string, max = 3): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  return list.length < max ? [...list, id] : [...list];
}

/** How a dot of a 1..5 score is drawn. */
export const dotFill = (score: number, i: number): "on" | "half" | "off" =>
  score >= i ? "on" : score >= i - 0.5 ? "half" : "off";

/** Rated skills (level above 0) as [skill index, level], best first. Ties keep the catalogue order. */
export function ratedSkills(rated: Record<string, number>): [number, number][] {
  return Object.entries(rated)
    .filter(([, l]) => l > 0)
    .map(([x, l]): [number, number] => [+x, l])
    .sort((a, b) => b[1] - a[1]);
}

/** The skills to show on the results card: the ten best rated, then own skills, twelve at most. */
export function topSkills(
  rated: Record<string, number>,
  own: readonly { name: string; level: number }[],
  label: (i: number) => string,
): string[] {
  return ratedSkills(rated)
    .slice(0, 10)
    .map(([x]) => label(x))
    .concat(own.filter((o) => o.level > 0).map((o) => o.name))
    .slice(0, 12);
}

/** Rows of the "more or less" sheet: rated skills, best first, then by name. */
export function wantRows(rated: Record<string, number>, label: (i: number) => string): [number, number][] {
  return ratedSkills(rated).sort((a, b) => b[1] - a[1] || label(a[0]).localeCompare(label(b[0])));
}

/** Leaving Your story: drop job rows without a title and make sure the main goal points at a goal. Mutates. */
export function cleanJobs(d: Doc): void {
  d.jobs = d.jobs.filter((j) => j.title);
  const g = mainGoal(d);
  if (!g || !d.mainGoal || !jobById(d, d.mainGoal)) d.mainGoal = g ? g.id : null;
}

/** A skill typed in plain words: an exact catalogue skill, a few close ones to choose from, or own words. */
export type SkillGuess = { kind: "exact" } | { kind: "meant"; hits: number[] } | { kind: "own" };
export function guessSkill(E: Esco, text: string): SkillGuess {
  const hits = searchSkillScored(E, text, 4);
  if (hits[0] && normTxt(E.lab.sk[hits[0][1]]) === normTxt(text)) return { kind: "exact" };
  if (hits.length) return { kind: "meant", hits: hits.map((h) => h[1]) };
  return { kind: "own" };
}

/** A finished touch: swipe left = next, right = back. Short or mostly vertical moves are scrolling. */
export function swipeDir(dx: number, dy: number): "next" | "back" | null {
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return null;
  return dx < 0 ? "next" : "back";
}

/** A digit key as an answer: 1..5 for questions, 0..5 for skill cards. Null for anything else. */
export function digitKey(key: string, min: number, max: number): number | null {
  if (!/^\d$/.test(key)) return null;
  const n = +key;
  return n >= min && n <= max ? n : null;
}
