import type { Doc, JobRole, Lang } from "@/data/types";
import { jobsIn } from "@/data/doc";
import type { Esco } from "@/domain/catalog";
import { makeT } from "@/i18n";
import { FACT_ORDER, factLines, profileFacts, savedText, type FactKey, type Facts } from "./facts";
import { strings } from "./strings";

/* Ready-made prompts for the AI chat the person already uses, built from the profile. Rules: never include
   name, address or contact details; ask for short answers; say what goes into each prompt.
   Pure; ported verbatim from the previous app (library.js). */

export type PromptKey =
  | "dayjob"
  | "translate"
  | "interview"
  | "meeting"
  | "compare"
  | "funding"
  | "underrated"
  | "patterns"
  | "newdirs";
/** The choices a prompt offers: a job, a goal, a past job. */
export type PromptOpt = "job" | "goal" | "past";
export type Uses = FactKey | "saved";
export interface LibItem {
  k: PromptKey;
  uses: readonly Uses[];
  opts: readonly PromptOpt[];
}

export const LIB: readonly LibItem[] = [
  { k: "dayjob", uses: ["setting", "strengths"], opts: ["job"] },
  { k: "translate", uses: ["skills"], opts: ["past", "goal"] },
  { k: "interview", uses: ["strengths", "skills", "jobs"], opts: ["job"] },
  { k: "meeting", uses: ["goals", "strengths", "gaps", "saved", "situation"], opts: ["goal"] },
  { k: "compare", uses: ["saved", "gaps", "setting", "goals"], opts: [] },
  { k: "funding", uses: ["situation", "goals", "german"], opts: [] },
  { k: "underrated", uses: ["jobs", "hobbies", "strengths"], opts: [] },
  { k: "patterns", uses: FACT_ORDER.filter((k) => k !== "place"), opts: [] },
  { k: "newdirs", uses: ["strengths", "interests", "values", "setting", "jobs", "german"], opts: [] },
];

/** The job titles a choice suggests: past jobs, or goals and maybes. */
export const namesFor = (d: Doc, role: JobRole): string[] =>
  role === "done"
    ? jobsIn(d, "done").map((j) => j.title)
    : jobsIn(d, "goal")
        .concat(jobsIn(d, "maybe"))
        .map((j) => j.title);

interface TextArgs {
  f: Facts;
  job: string;
  goal: string;
  pjob: string;
  facts: (keys: readonly FactKey[]) => string;
  saved: string;
}
const notPlace = FACT_ORDER.filter((k) => k !== "place");

export const PL_TEXT: Record<Lang, Record<PromptKey, (x: TextArgs) => string>> = {
  en: {
    dayjob: (x) => `Describe a normal working day as ${x.job} in Germany, briefly:

- typical tasks, from morning to evening
- usual hours, shifts and weekend work
- physical demands (standing, lifting, outdoors)
- usual training route in Germany (Ausbildung, retraining, courses) and how long it takes
- rough pay range, and point me to the Entgeltatlas of the Bundesagentur für Arbeit for exact figures
- two good sides and two hard sides for someone like me

${x.facts(["setting", "strengths"])}

If you are unsure about a fact, say so.`,
    funding: (
      x,
    ) => `I live in Germany and I am working with the Agentur für Arbeit or the Jobcenter. Which kinds of funding and support could fit my situation? For example training, coaching, trial work or help with applications.

For each option, give one line on what it is and one question I can ask my caseworker about it. Mark anything you are not sure is still current, because rules change.
Keep it short.

${x.facts(["situation", "goals", "german"])}`,
    underrated: (
      x,
    ) => `Help me find skills I am underrating. Ask me one question at a time, at most 8 questions in total, about things I have done at work, at home, in volunteering or in my free time. Wait for my answer each time.

After the last question, list the skills you found. For each one, say in a few words which of my answers shows it. Use plain language.

What you know about me so far:
${x.facts(["jobs", "hobbies", "strengths"]) || "[Write a few lines about your jobs and what you do in your free time.]"}`,
    patterns: (x) => `Here is a short profile of me. Tell me briefly:

1. Three patterns you see.
2. Two things that might surprise me.
3. Three questions I should think about before choosing my next job.

Be honest and specific. Do not flatter me.

${x.facts(notPlace) || "[Write a few lines about yourself.]"}`,
    translate: (x) => `I worked as ${x.pjob} and want to move into ${x.goal}.

1. List the skills from my past job that carry over, and how to name them in an application for the new job.
2. List what is clearly missing.
3. Suggest one sentence I could use in a cover letter to explain the move.

Keep it short.

${x.facts(["skills"])}`,
    newdirs: (
      x,
    ) => `Based on my profile below, suggest 6 kinds of work I may not have considered. For each one, give one line on why it fits and one line on what to watch out for. Respect what is ruled out for me.

${x.facts(["strengths", "interests", "values", "setting", "jobs", "german"]) || "[Write a few lines about yourself.]"}`,
    meeting: (
      x,
    ) => `I have a meeting with my caseworker at the Agentur für Arbeit or Jobcenter. My goal is ${x.goal}. Help me prepare, briefly:

1. Five short talking points that explain my goal and why it fits me.
2. Four questions the caseworker may ask, with a short answer for each.
3. A short list of what to bring (documents, job ads, course offers).

${x.facts(["goals", "strengths", "gaps", "situation"])}
${x.saved ? "\nWhat I have found so far:\n" + x.saved : ""}`,
    interview: (
      x,
    ) => `Practise a job interview with me for a position as ${x.job}. Ask one question at a time and wait for my answer. After each answer, give me one short tip. Stop after 6 questions and sum up what went well and what to work on.

${x.facts(["strengths", "skills", "jobs"])}`,
    compare: (
      x,
    ) => `Compare the courses and job ads I saved, in one short table, then give me your top pick with two reasons. Point out anything important that is missing, such as price, dates or funding. Do not invent facts.

What I saved:
${x.saved || "[Nothing saved yet. Add courses or job ads to a goal first.]"}

${x.facts(["goals", "gaps", "setting"])}`,
  },
  de: {
    dayjob: (x) => `Beschreibe kurz einen normalen Arbeitstag als ${x.job} in Deutschland:

- typische Aufgaben von morgens bis abends
- übliche Arbeitszeiten, Schichten und Wochenendarbeit
- körperliche Anforderungen (Stehen, Heben, draußen)
- üblicher Weg dorthin in Deutschland (Ausbildung, Umschulung, Kurse) und wie lange er dauert
- ungefähre Gehaltsspanne, mit Hinweis auf den Entgeltatlas der Bundesagentur für Arbeit für genaue Zahlen
- zwei gute und zwei schwierige Seiten für jemanden wie mich

${x.facts(["setting", "strengths"])}

Wenn du dir bei etwas nicht sicher bist, sag es.`,
    funding: (
      x,
    ) => `Ich bin bei der Agentur für Arbeit oder beim Jobcenter. Welche Förderung und Unterstützung könnte zu meiner Lage passen? Zum Beispiel Weiterbildung, Coaching, Probearbeit oder Hilfe bei Bewerbungen.

Gib zu jeder Möglichkeit eine Zeile, was sie ist, und eine Frage, die ich meiner Beratung dazu stellen kann. Markiere alles, bei dem du nicht sicher bist, ob es noch aktuell ist, weil sich Regeln ändern.
Halte es kurz.

${x.facts(["situation", "goals", "german"])}`,
    underrated: (
      x,
    ) => `Hilf mir, Fähigkeiten zu finden, die ich unterschätze. Stell mir eine Frage nach der anderen, höchstens 8 Fragen, zu dem, was ich bei der Arbeit, zu Hause, im Ehrenamt oder in der Freizeit gemacht habe. Warte jedes Mal auf meine Antwort.

Nach der letzten Frage liste die Fähigkeiten auf, die du gefunden hast. Sag zu jeder in wenigen Worten, welche meiner Antworten sie zeigt. Schreib in einfacher Sprache.

Was du bisher über mich weißt:
${x.facts(["jobs", "hobbies", "strengths"]) || "[Schreiben Sie ein paar Zeilen über Ihre Stellen und was Sie in Ihrer Freizeit tun.]"}`,
    patterns: (x) => `Hier ist ein kurzes Profil von mir. Sag mir knapp:

1. Drei Muster, die du siehst.
2. Zwei Dinge, die mich überraschen könnten.
3. Drei Fragen, über die ich nachdenken sollte, bevor ich meine nächste Stelle wähle.

Sei ehrlich und konkret. Schmeichle mir nicht.

${x.facts(notPlace) || "[Schreiben Sie ein paar Zeilen über sich.]"}`,
    translate: (x) => `Ich habe als ${x.pjob} gearbeitet und möchte als ${x.goal} arbeiten.

1. Liste die Fähigkeiten aus meiner früheren Stelle auf, die mitkommen, und wie ich sie in einer Bewerbung für den neuen Beruf nenne.
2. Liste auf, was klar fehlt.
3. Schlage einen Satz für das Anschreiben vor, der den Wechsel erklärt.

Halte es kurz.

${x.facts(["skills"])}`,
    newdirs: (
      x,
    ) => `Schlage mir auf Grundlage meines Profils unten 6 Arten von Arbeit vor, an die ich vielleicht nicht gedacht habe. Gib zu jeder eine Zeile, warum sie passt, und eine Zeile, worauf ich achten sollte. Beachte, was für mich nicht geht.

${x.facts(["strengths", "interests", "values", "setting", "jobs", "german"]) || "[Schreiben Sie ein paar Zeilen über sich.]"}`,
    meeting: (
      x,
    ) => `Ich habe einen Termin bei meiner Beratung in der Agentur für Arbeit oder im Jobcenter. Mein Ziel ist ${x.goal}. Hilf mir kurz bei der Vorbereitung:

1. Fünf kurze Gesprächspunkte, die mein Ziel erklären und warum es zu mir passt.
2. Vier Fragen, die mir gestellt werden könnten, mit je einer kurzen Antwort.
3. Eine kurze Liste, was ich mitbringen sollte (Unterlagen, Stellenanzeigen, Kursangebote).

${x.facts(["goals", "strengths", "gaps", "situation"])}
${x.saved ? "\nWas ich bisher gefunden habe:\n" + x.saved : ""}`,
    interview: (
      x,
    ) => `Übe mit mir ein Vorstellungsgespräch für eine Stelle als ${x.job}. Stell eine Frage nach der anderen und warte auf meine Antwort. Gib mir nach jeder Antwort einen kurzen Tipp. Hör nach 6 Fragen auf und fasse zusammen, was gut lief und woran ich arbeiten sollte.

${x.facts(["strengths", "skills", "jobs"])}`,
    compare: (
      x,
    ) => `Vergleiche die Kurse und Stellen, die ich mir gemerkt habe, in einer kurzen Tabelle. Nenne dann deinen Favoriten mit zwei Gründen. Weise darauf hin, wenn etwas Wichtiges fehlt, etwa Preis, Termine oder Förderung. Erfinde nichts.

Was ich mir gemerkt habe:
${x.saved || "[Noch nichts gemerkt. Fügen Sie zuerst bei einem Ziel Kurse oder Stellen hinzu.]"}

${x.facts(["goals", "gaps", "setting"])}`,
  },
};

export type PromptChoices = Partial<Record<PromptOpt, string>>;

/** The prompt text for the person's latest data and choices. */
export function libText(d: Doc, E: Esco | null, lang: Lang, k: PromptKey, o: PromptChoices = {}): string {
  const f = profileFacts(d, E, lang);
  const goals = namesFor(d, "goal");
  const past = namesFor(d, "done");
  const job = o.job || goals[0] || "[job]";
  const goal = o.goal || goals[0] || "[goal]";
  const pjob = o.past || past[0] || "[past job]";
  return PL_TEXT[lang][k]({
    f,
    job,
    goal,
    pjob,
    facts: (keys) => factLines(f, keys, lang),
    saved: savedText(d),
  });
}

/** "Contains: your goals, your skills…" for a prompt. */
export function libContains(d: Doc, E: Esco | null, lang: Lang, item: LibItem): string {
  const T = makeT(lang, strings);
  const f = profileFacts(d, E, lang);
  const has = item.uses.filter((k) => (k === "saved" ? !!savedText(d) : !!f[k]));
  return has.length
    ? T("pl_contains", { x: has.map((k) => T(`ct_${k}`)).join(", ") })
    : T("pl_contains_none");
}
