import type { CoursePrefs, Doc, Job, Lang, Profile, SkillRef } from "@/data/types";
import { jobById } from "@/data/doc";
import { cap, type Esco } from "@/domain/catalog";
import { jobTiles, searchTerm, type Tile } from "@/domain/skills";
import { makeT } from "@/i18n";
import { profileFields } from "@/i18n/profileFields";
import { strings } from "./strings";
import type { FinderSpec } from "./types";

/* The texts the finder builds: course wishes, search words and the AI prompt. Pure; ported from the previous
   app. The search words are always German (they go into German search engines); the prompt follows the
   interface language. Neither ever contains the person's name or contact details. */

/* ---------- course wishes, asked once ---------- */
export const PREF_OPTS = {
  lang: ["de", "en", "any"],
  where: ["near", "online", "any"],
  time: ["full", "part", "eve", "any"],
  start: ["soon", "6", "any"],
} as const satisfies { [K in keyof Omit<CoursePrefs, "voucher">]: readonly CoursePrefs[K][] };
export type PrefKey = keyof typeof PREF_OPTS;
export const PREF_KEYS = Object.keys(PREF_OPTS) as PrefKey[];

/** The saved wishes, or a first guess from the profile. */
export function prefsOf(P: Profile): CoursePrefs {
  if (P.coursePrefs) return P.coursePrefs;
  const g = P.german;
  return {
    lang: ["native", "c", "b2", "b1"].includes(g) ? "de" : "any",
    where: P.location ? "near" : "any",
    time: P.hours === "full" ? "full" : P.hours === "part" ? "part" : "any",
    start: "any",
    voucher: true,
  };
}
/** The town: the first part of the location. */
export const townOf = (P: Profile): string =>
  String(P.location || "")
    .split(",")[0]
    .trim();

const tIn = (lang: Lang) => makeT(lang, strings, profileFields);

export function prefLabel(lang: Lang, P: Profile, k: PrefKey, v: string): string {
  const T = tIn(lang);
  const town = townOf(P);
  if (k === "where" && v === "near") return town ? T("p_where_near", { x: town }) : T("p_where_near0");
  return T(`p_${k}_${v}` as Parameters<typeof T>[0]);
}
/** The one-line summary of the wishes, shown on the closed panel. */
export function prefsSummary(lang: Lang, P: Profile): string {
  const p = prefsOf(P);
  return (
    [
      prefLabel(lang, P, "lang", p.lang),
      prefLabel(lang, P, "where", p.where),
      prefLabel(lang, P, "time", p.time),
    ].join(" · ") + (p.voucher ? " · AZAV" : "")
  );
}

/* ---------- what the texts are built from ---------- */
export interface FinderCtx {
  job: Job | null;
  skill: SkillRef | null;
  tiles: Tile[];
  /** the job's skills the person does not have yet */
  gaps: Tile[];
  goalEn: string;
  goalDe: string;
  skillEn: string;
  skillDe: string;
}
const occDe = (E: Esco, i: number) => (E.de ? E.de.occ[i] : E.lab.occ[i]);
const skDe = (E: Esco, i: number) => (E.de ? E.de.sk[i] : E.lab.sk[i]);

export function finderCtx(d: Doc, E: Esco, F: FinderSpec): FinderCtx {
  const job = jobById(d, F.job);
  const occ = job?.occ ?? -1;
  const skill = F.skill;
  const tiles = job ? jobTiles(d, E, job.occ, job) : [];
  return {
    job,
    skill,
    tiles,
    gaps: tiles.filter((t) => t.state !== "have"),
    goalEn: job ? (occ >= 0 && E.en ? cap(E.en.occ[occ]) : job.title) : "",
    goalDe: job ? (occ >= 0 ? occDe(E, occ) : job.title) : "",
    skillEn: skill == null ? "" : typeof skill === "number" && E.en ? cap(E.en.sk[skill]) : String(skill),
    skillDe: skill == null ? "" : typeof skill === "number" ? skDe(E, skill) : String(skill),
  };
}

export function searchWords(d: Doc, E: Esco, F: FinderSpec): string {
  const c = finderCtx(d, E, F);
  const p = prefsOf(d.profile);
  const town = townOf(d.profile);
  const w: string[] = [];
  if (F.kind === "jobad") {
    w.push(`"${searchTerm(c.goalDe)}"`, "Stelle");
    if (town) w.push(town);
    if (d.profile.hours === "part") w.push("Teilzeit");
    return w.join(" ");
  }
  w.push(`"${searchTerm(c.skillDe || c.goalDe)}"`);
  if (c.skillDe && c.goalDe) w.push(searchTerm(c.goalDe));
  w.push("Weiterbildung");
  if (p.voucher) w.push("Bildungsgutschein", "AZAV");
  if (p.where === "near" && town) w.push(town);
  if (p.where === "online") w.push("online");
  if (p.time === "part") w.push("Teilzeit");
  if (p.time === "eve") w.push("berufsbegleitend", "abends");
  if (p.time === "full") w.push("Vollzeit");
  if (p.lang === "en") w.push("Englisch", "English");
  return w.join(" ");
}

/** The words for the official search (mein NOW or the Jobbörse). */
export const officialTerm = (c: FinderCtx): string => searchTerm(c.skillDe || c.goalDe);

const FMT_COURSES = `{"courses":[{"name":"","provider":"","url":"","start":"","length":"","schedule":"","format":"","language":"","price":"","funding":"","azav":"yes, no or unknown","covers":["exact skill names from my list"],"note":""}]}`;
const FMT_JOBADS = `{"jobads":[{"name":"","org":"","place":"","url":"","hours":"","pay":"","deadline":"","reqs":""}]}`;

export function aiPrompt(d: Doc, E: Esco, F: FinderSpec, lang: Lang): string {
  const c = finderCtx(d, E, F);
  const p = prefsOf(d.profile);
  const P = d.profile;
  const de = lang === "de";
  const T = tIn(lang);
  const L = (k: string) => T(k as Parameters<typeof T>[0]);
  const town = townOf(P);
  const url = (F.url || "").trim();
  const gapNames = c.skill != null ? [c.skillEn || c.skillDe] : c.gaps.slice(0, 14).map((t) => t.name);
  const facts: string[] = [];
  if (P.german) facts.push((de ? "Mein Deutsch: " : "My German: ") + L("g_" + P.german));
  if (P.languages) facts.push((de ? "Sprachen: " : "Languages: ") + P.languages);
  if (P.situation) facts.push((de ? "Meine Situation: " : "My situation: ") + L("w_sit_" + P.situation));
  if (F.kind === "jobad") {
    const where = town
      ? de
        ? `in der Nähe von ${town} (etwa 25 km)`
        : `near ${town} (about 25 km)`
      : de
        ? "in Deutschland"
        : "in Germany";
    return de
      ? `Ich suche Stellen als ${c.goalDe || c.goalEn} ${where}.
${url ? `Lies diese Stellenanzeige: ${url}\nWenn du sie nicht öffnen kannst, sag das in einem Satz.` : `Suche im Internet 3 bis 5 echte, aktuelle Stellenanzeigen, zum Beispiel in der Jobbörse der Bundesagentur für Arbeit. Wenn du nicht im Internet suchen kannst, sag das in einem Satz und erfinde keine.`}
${P.hours ? `Arbeitszeit: ${L("w_hours_" + P.hours)}` : ""}
${facts.join("\n")}

Antworte kurz: zu jeder Stelle eine Zeile, warum sie passen könnte. Ende deine Antwort mit genau einem JSON-Codeblock in diesem Format (Feldnamen auf Englisch, Inhalte auf Deutsch). Nimm jede Angabe nur aus der Anzeige, lass ein Feld leer (""), wenn sie es nicht sagt:
${FMT_JOBADS}`
      : `I am looking for jobs as ${c.goalEn || c.goalDe} (German: ${c.goalDe}) ${where}.
${url ? `Read this job ad: ${url}\nIf you cannot open it, say so in one sentence.` : `Search the web for 3 to 5 real, current job ads, for example on the Jobbörse of the Bundesagentur für Arbeit. If you cannot search the web, say so in one sentence and do not invent any.`}
${P.hours ? `Hours: ${L("w_hours_" + P.hours)}` : ""}
${facts.join("\n")}

Keep it short: one line per job on why it could fit. End your answer with exactly one JSON code block in this format. Take every fact only from the ad and leave a field "" if the ad does not say it:
${FMT_JOBADS}`;
  }
  const wish: string[] = [];
  wish.push((de ? "Sprache des Kurses: " : "Course language: ") + L("p_lang_" + p.lang));
  wish.push(
    (de ? "Ort: " : "Where: ") +
      (p.where === "near"
        ? town
          ? de
            ? `in der Nähe von ${town}`
            : `near ${town}`
          : L("p_where_near0")
        : L("p_where_" + p.where)),
  );
  wish.push((de ? "Zeit: " : "Time: ") + L("p_time_" + p.time));
  wish.push((de ? "Beginn: " : "Start: ") + L("p_start_" + p.start));
  if (p.voucher)
    wish.push(
      de
        ? "Bezahlt mit Bildungsgutschein: Der Kurs muss AZAV-zertifiziert sein."
        : "Paid with a Bildungsgutschein: the course must be AZAV-certified.",
    );
  return de
    ? `Ich möchte als ${c.goalDe || c.goalEn} arbeiten und suche eine Weiterbildung${c.skill != null ? ` für: ${c.skillDe}` : ""}.
${url ? `Lies diese Kursseite: ${url}\nWenn du sie nicht öffnen kannst, sag das in einem Satz.` : `Suche im Internet 3 bis 5 echte Kurse, die passen, zum Beispiel bei mein NOW (mein-now.de) oder auf Anbieterseiten. Wenn du nicht im Internet suchen kannst, sag das in einem Satz und erfinde keine Kurse.`}

Meine Wünsche:
${wish.map((x) => "- " + x).join("\n")}
${facts.join("\n")}

Fähigkeiten, die mir für das Ziel fehlen:
${gapNames.map((x) => "- " + x).join("\n") || "- [keine]"}

Antworte kurz: zu jedem Kurs eine Zeile, warum er passt. Gib zu jedem Kurs den Link an. Bei AZAV schreib nur, was die Seite sagt. Ende deine Antwort mit genau einem JSON-Codeblock in diesem Format (Feldnamen auf Englisch, Inhalte auf Deutsch). In "covers" stehen nur Namen aus meiner Liste oben, genau so geschrieben. Nimm jede Angabe nur von der Seite und lass ein Feld leer (""), wenn sie es nicht sagt:
${FMT_COURSES}`
    : `I want to work as ${c.goalEn || c.goalDe} (German: ${c.goalDe}) and I am looking for training${c.skill != null ? ` in: ${c.skillEn}` : ""}.
${url ? `Read this course page: ${url}\nIf you cannot open it, say so in one sentence.` : `Search the web for 3 to 5 real courses that fit, for example on mein NOW (mein-now.de) or on provider pages. If you cannot search the web, say so in one sentence and do not invent any courses.`}

My wishes:
${wish.map((x) => "- " + x).join("\n")}
${facts.join("\n")}

Skills I am missing for this goal:
${gapNames.map((x) => "- " + x).join("\n") || "- [none]"}

Keep it short: one line per course on why it fits. Give the link for each course. For AZAV, only write what the page says. End your answer with exactly one JSON code block in this format. In "covers", use only names from my list above, written exactly the same. Take every fact only from the page and leave a field "" if the page does not say it:
${FMT_COURSES}`;
}
