import { create } from "zustand";
import type { Lang } from "@/data/types";

/* =================== THE JOB CATALOGUE (ESCO) AND O*NET ===================
   Occupations and skills from ESCO v1.2.1 (graph + labels per language), plus O*NET interest profiles,
   preparation levels and work context per ESCO occupation. Files live in public/esco and are fetched
   once; the service worker keeps them for offline use. */

export interface Graph {
  v: string;
  /** occupation → essential skill indexes */
  e: number[][];
  /** occupation → optional skill indexes */
  o: number[][];
  /** skill → group index */
  g: number[];
  /** skill → 1 when it is knowledge rather than a skill */
  k: (0 | 1)[];
}
export interface Labels {
  lang: Lang;
  occ: string[];
  /** alternative labels, one string per occupation, separated by newlines */
  alt: string[];
  sk: string[];
  groups: string[];
}
export type ContextKey =
  | "contact"
  | "customers"
  | "outdoors"
  | "standing"
  | "sitting"
  | "hands"
  | "phone"
  | "vehicle"
  | "routine"
  | "irregular"
  | "heights"
  | "noise"
  | "strength";
export interface Onet {
  v: string;
  /** RIASEC profile ×10, in R I A S E C order */
  r: (number[] | null)[];
  /** Job Zone 1..4 (preparation level) */
  z: (number | null)[];
  /** 1 = direct crosswalk match, 0 = rough (from a similar job) */
  q: (0 | 1 | null)[];
  /** work context measures and static strength, 0..100 */
  c: Record<ContextKey, (number | null)[]>;
  /** German level (CEFR) by occupation index, only where a law or regulation states one (data/german-level.csv) */
  lv?: Record<string, string>;
}
export interface Esco {
  lang: Lang;
  g: Graph;
  lab: Labels;
  /** English labels (for prompts and the cross-language index), when loaded */
  en: Labels | null;
  /** German labels (for search links), when loaded */
  de: Labels | null;
  /** normalised labels per occupation: own language first, then the other */
  occN: string[][];
  skN: string[][];
  /** normalised English label → occupation */
  enIdx: Record<string, number>;
  /** the labels of the wanted language were missing and English is shown instead */
  fallback: boolean;
}

/* ---------- loading ---------- */
const BASE = import.meta.env.BASE_URL + "esco/";
let graphP: Promise<Graph> | null = null;
const labelsP: Partial<Record<Lang, Promise<Labels | null>>> = {};

async function fetchJson<T>(name: string): Promise<T> {
  const r = await fetch(BASE + name);
  if (!r.ok) throw new Error(name + " " + r.status);
  return r.json() as Promise<T>;
}
function labels(l: Lang): Promise<Labels | null> {
  if (!labelsP[l])
    labelsP[l] = fetchJson<Labels>(l + ".json").catch(() => {
      delete labelsP[l];
      return null;
    });
  return labelsP[l]!;
}

export const normTxt = (s: unknown): string =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\((m|w|d|f|x)(\/(m|w|d|f|x))*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

async function buildEsco(want: Lang): Promise<Esco> {
  if (!graphP)
    graphP = fetchJson<Graph>("graph.json").catch((e) => {
      graphP = null;
      throw e;
    });
  const g = await graphP;
  let lab = await labels(want);
  let fallback = false;
  if (!lab) {
    lab = await labels("en");
    fallback = want !== "en";
    if (!lab) throw new Error("labels");
  }
  const other = await labels(want === "de" ? "en" : "de");
  const occLabs = (L: Labels, i: number) =>
    [normTxt(L.occ[i])].concat((L.alt[i] || "").split("\n").filter(Boolean).map(normTxt));
  const both = other && other !== lab;
  const occN = lab.occ.map((_, i) => (both ? occLabs(lab, i).concat(occLabs(other, i)) : occLabs(lab, i)));
  const skN = lab.sk.map((l, i) => (both ? [normTxt(l), normTxt(other.sk[i])] : [normTxt(l)]));
  const en = lab.lang === "en" ? lab : other?.lang === "en" ? other : null;
  const de = lab.lang === "de" ? lab : other?.lang === "de" ? other : null;
  const enIdx: Record<string, number> = {};
  en?.occ.forEach((l, i) => (enIdx[normTxt(l)] = i));
  return { lang: want, g, lab, en, de, occN, skN, enIdx, fallback };
}

/* ---------- the catalogue as app state ---------- */
type Status = "idle" | "loading" | "ready" | "error";
interface CatalogState {
  esco: Esco | null;
  onet: Onet | null;
  status: Status;
}
export const useCatalog = create<CatalogState>(() => ({ esco: null, onet: null, status: "idle" }));

let loading: { lang: Lang; p: Promise<Esco> } | null = null;
/** Load the catalogue in a language (cached). Resolves when it is ready; never throws. */
export async function loadCatalog(lang: Lang): Promise<Esco | null> {
  const cur = useCatalog.getState().esco;
  if (cur && cur.lang === lang) {
    loading = null; // a load for the other language that is still running must not replace this one
    return cur;
  }
  if (loading?.lang === lang) return loading.p.catch(() => null);
  if (!cur) useCatalog.setState({ status: "loading" });
  const p = buildEsco(lang);
  loading = { lang, p };
  void loadOnet();
  try {
    const esco = await p;
    if (loading?.p === p) useCatalog.setState({ esco, status: "ready" });
    return esco;
  } catch {
    if (loading?.p === p && !useCatalog.getState().esco) useCatalog.setState({ status: "error" });
    return null;
  } finally {
    if (loading?.p === p) loading = null;
  }
}

/* O*NET: a failed download is tried again on a later call (phones drop requests), at most every 10 seconds */
let onetP: Promise<Onet | null> | null = null;
let onetFail = 0;
export function loadOnet(): Promise<Onet | null> {
  const have = useCatalog.getState().onet;
  if (have) return Promise.resolve(have);
  if (onetP) return onetP;
  if (Date.now() - onetFail < 10000) return Promise.resolve(null);
  onetP = fetchJson<Onet>("onet.json")
    .then((o) => {
      useCatalog.setState({ onet: o });
      return o;
    })
    .catch(() => {
      onetFail = Date.now();
      return null;
    })
    .finally(() => {
      onetP = null;
    });
  return onetP;
}

/* ---------- search ---------- */
function scoreLabels(q: string, labelsN: string[]): number {
  const qt = q.split(" ").filter((w) => w.length > 1);
  let best = 0;
  labelsN.forEach((l, j) => {
    let s = 0;
    if (l === q) s = 100;
    else if (l.startsWith(q)) s = 80;
    else if (l.includes(q)) s = 60;
    else if (qt.length) {
      const lt = l.split(" ");
      const hit = qt.filter((w) =>
        lt.some((t) => t.startsWith(w) || (w.startsWith(t) && t.length > 3)),
      ).length;
      s = (hit / qt.length) * 50 - (lt.length > qt.length + 3 ? 5 : 0);
    }
    if (j === 0) s += 3;
    if (s > best) best = s;
  });
  return best;
}

/* common German job titles, many of them Ausbildung names, that the catalogue lists under another name */
const OCC_SYN: [string, string[]][] = [
  ["buromanagement", ["office clerk", "administrative assistant"]],
  ["industriekauf", ["office clerk", "purchaser"]],
  ["einzelhandel", ["sales assistant", "shop assistant"]],
  ["lagerlogistik", ["warehouse worker", "warehouse order picker", "warehouse manager"]],
  ["fachlagerist", ["warehouse worker"]],
  ["lagerist", ["warehouse worker"]],
  ["kommissionier", ["warehouse order picker"]],
  ["staplerfahrer", ["forklift operator"]],
  ["altenpflegehelfer", ["residential home older adult care worker", "healthcare assistant"]],
  ["altenpfleg", ["residential home older adult care worker", "nurse responsible for general care"]],
  ["pflegefach", ["nurse responsible for general care"]],
  ["pflegeassist", ["healthcare assistant"]],
  ["erzieher", ["early years teacher", "child care worker"]],
  ["kinderpfleg", ["child care worker"]],
  ["kfz mechatroniker", ["vehicle technician"]],
  ["kraftfahrzeugmechatroniker", ["vehicle technician"]],
  ["berufskraftfahrer", ["cargo vehicle driver"]],
  ["lkw fahrer", ["cargo vehicle driver"]],
  ["gebaudereinig", ["building cleaner"]],
  ["steuerfachangestellte", ["tax clerk"]],
  ["spedition", ["forwarding manager"]],
  ["hotelfach", ["hospitality establishment receptionist"]],
  ["restaurantfach", ["waiter/waitress"]],
  ["gastgewerbe", ["waiter/waitress", "kitchen assistant"]],
  ["fachinformatiker", ["integration engineer", "software developer"]],
  ["anwendungsentwickl", ["software developer"]],
  ["anlagenmechaniker", ["plumber"]],
  ["maler und lackierer", ["construction painter"]],
  ["zusteller", ["postman/postwoman", "car and van delivery driver"]],
  ["kurierfahrer", ["car and van delivery driver"]],
  ["sicherheitsmitarbeiter", ["security guard"]],
  ["sicherheitsdienst", ["security guard"]],
  ["callcenter", ["call centre agent"]],
  ["call center", ["call centre agent"]],
];
function synOcc(E: Esco, q: string): number[] {
  const out: number[] = [];
  const last = q.split(" ").pop() || "";
  OCC_SYN.forEach(([k, t]) => {
    if ((" " + q).includes(" " + k) || (last.length >= 5 && k.startsWith(last)))
      t.forEach((l) => {
        const i = E.enIdx[normTxt(l)];
        if (i != null && !out.includes(i)) out.push(i);
      });
  });
  return out;
}

/** Occupations matching typed words, best first. Searches English and German labels. */
export function searchOcc(E: Esco, text: string, n = 8): number[] {
  const q = normTxt(text);
  if (!q) return [];
  const out: [number, number][] = [];
  const syn = synOcc(E, q);
  E.occN.forEach((labelsN, i) => {
    let s = scoreLabels(q, labelsN);
    if (syn.includes(i)) s = 110 - syn.indexOf(i);
    if (s >= 25) out.push([s, i]);
  });
  return out
    .sort((a, b) => b[0] - a[0] || E.lab.occ[a[1]].length - E.lab.occ[b[1]].length)
    .slice(0, n)
    .map((x) => x[1]);
}
/** Skills matching typed words, with their score. */
export function searchSkillScored(E: Esco, text: string, n = 8): [number, number][] {
  const q = normTxt(text);
  if (!q) return [];
  const out: [number, number][] = [];
  E.skN.forEach((l, i) => {
    const s = scoreLabels(q, l);
    if (s >= 40) out.push([s, i]);
  });
  return out.sort((a, b) => b[0] - a[0] || E.lab.sk[a[1]].length - E.lab.sk[b[1]].length).slice(0, n);
}
export const searchSkill = (E: Esco, text: string, n?: number): number[] =>
  searchSkillScored(E, text, n).map((x) => x[1]);

/* ---------- labels ---------- */
export const occLabel = (E: Esco | null, i: number | null | undefined): string =>
  E && i != null && i >= 0 ? cap(E.lab.occ[i]) : "";
export const skLabel = (E: Esco | null, i: number): string => (E ? cap(E.lab.sk[i]) : "");
/** The label in a given language (for prompts, search links and the printed plan). */
export function occIn(E: Esco, i: number, lang: Lang): string {
  const L = lang === "de" ? E.de : E.en;
  return cap((L || E.lab).occ[i]);
}
export function skIn(E: Esco, i: number, lang: Lang): string {
  const L = lang === "de" ? E.de : E.en;
  return cap((L || E.lab).sk[i]);
}
export const isKnowledge = (E: Esco | null, i: number): boolean => !!(E && E.g.k[i]);
