import type { Doc, Lang } from "@/data/types";
import { jobsIn, mainGoal } from "@/data/doc";
import { interestCode, assessOf, strongest } from "@/domain/assess";
import { skLabel, type Esco } from "@/domain/catalog";
import { RULED_OUT, SETTING, VALUES } from "@/domain/items";
import { jobTiles } from "@/domain/skills";
import { makeT } from "@/i18n";
import { profileFields } from "@/i18n/profileFields";
import { strings } from "./strings";

/* What we know about the person, as plain text for prompts. Never the name, address or contact details.
   Pure; ported from the previous app (library.js). */

export const FACT_ORDER = [
  "situation",
  "jobs",
  "goals",
  "strengths",
  "interests",
  "values",
  "setting",
  "skills",
  "gaps",
  "german",
  "hobbies",
  "place",
] as const;
export type FactKey = (typeof FACT_ORDER)[number];
export type Facts = Partial<Record<FactKey, string>>;

export function profileFacts(d: Doc, E: Esco | null, lang: Lang): Facts {
  const T = makeT(lang, strings, profileFields);
  const L = (k: string) => T(k as Parameters<typeof T>[0]);
  const f: Facts = {};
  const a = assessOf(d);
  const P = d.profile;
  const st = strongest(d, lang);
  if (st.length) f.strengths = st.map((r) => r.name).join(", ");
  const ic = interestCode(d, lang);
  if (ic.length) f.interests = ic.map((c) => c.id + " " + c.name).join(", ");
  if (a.values.length)
    f.values = a.values
      .map((id) => {
        const v = VALUES.find((x) => x.id === id);
        return v ? v[lang][0] : "";
      })
      .filter(Boolean)
      .join(", ");
  const s = a.setting;
  const prefs = SETTING.filter((x) => s[x.id] && s[x.id] !== 3).map((x) => {
    const l = x[lang];
    return (s[x.id] < 3 ? l[0] : l[1]).toLowerCase();
  });
  const outs = RULED_OUT.filter((o) => a.ruledOut.includes(o.id)).map((o) => {
    const t = o.p?.[lang] || o[lang] || o.en;
    return lang === "de" ? t : t.toLowerCase();
  });
  if (prefs.length || outs.length)
    f.setting = [
      prefs.length ? T("pf_rather") + " " + prefs.join(", ") : "",
      outs.length ? T("pf_out") + " " + outs.join(", ") : "",
    ]
      .filter(Boolean)
      .join(". ");
  if (E) {
    const sk = Object.entries(d.esco.rated)
      .filter(([, l]) => l >= 3)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 20)
      .map(([x]) => skLabel(E, +x))
      .concat(d.esco.own.filter((o) => o.level >= 3 && o.esco == null).map((o) => o.name));
    const w = d.esco.want || {};
    const wn = (v: 1 | -1) =>
      Object.keys(w)
        .filter((x) => w[x] === v)
        .map((x) => skLabel(E, +x));
    const parts = [
      sk.join(", "),
      wn(1).length ? T("pf_want_more") + " " + wn(1).join(", ") : "",
      wn(-1).length ? T("pf_want_less") + " " + wn(-1).join(", ") : "",
    ].filter(Boolean);
    if (parts.length) f.skills = parts.join(". ");
    const g = mainGoal(d);
    if (g && (g.occ ?? -1) >= 0) {
      const miss = jobTiles(d, E, g.occ, g)
        .filter((t) => t.state !== "have")
        .slice(0, 15)
        .map((t) => t.name);
      if (miss.length) f.gaps = miss.join(", ");
    }
  }
  const jobs = jobsIn(d, "done");
  if (jobs.length) f.jobs = jobs.map((j) => j.title + (j.when ? " (" + j.when + ")" : "")).join("; ");
  const goals = jobsIn(d, "goal");
  if (goals.length) f.goals = goals.map((j) => j.title).join(", ");
  if (P.location) f.place = String(P.location).split(",")[0].trim();
  if (P.german)
    f.german = L("g_" + P.german) + (P.computer ? ". " + T("f_computer") + ": " + L("pc_" + P.computer) : "");
  if (P.situation) f.situation = L("w_sit_" + P.situation);
  if (P.hobbies || P.projects) f.hobbies = [P.hobbies, P.projects].filter(Boolean).join("; ");
  return f;
}

/** "Label: value" lines for the given facts, in the given order, skipping what is unknown. */
export function factLines(f: Facts, keys: readonly FactKey[], lang: Lang): string {
  const T = makeT(lang, strings);
  return keys
    .filter((k) => f[k])
    .map((k) => T(`pf_${k}`) + ": " + f[k])
    .join("\n");
}

/** The saved courses and job ads, one line each. */
export function savedText(d: Doc): string {
  const lines: string[] = [];
  d.courses.forEach((c) =>
    lines.push(
      "- " +
        [c.name, c.provider, c.length, c.start, c.price, c.funding, c.format, c.url]
          .filter(Boolean)
          .join(" | "),
    ),
  );
  d.jobads.forEach((j) =>
    lines.push("- " + [j.name, j.org, j.place, j.hours, j.pay, j.url].filter(Boolean).join(" | ")),
  );
  return lines.join("\n");
}
