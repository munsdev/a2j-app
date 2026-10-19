import type { Course, Doc, Job, JobAd, Lang, PlanSection, Profile } from "@/data/types";
import { jobById, mainGoal } from "@/data/doc";
import { interestCode, assessOf, strongest } from "@/domain/assess";
import { skIn, type Esco } from "@/domain/catalog";
import { VALUES } from "@/domain/items";
import { jobCount, type JobCount } from "@/domain/skills";
import { BRAND, SITE } from "@/i18n/common";
import { makeT } from "@/i18n";
import { strings as courseStrings } from "@/features/courses/strings";
import { strings } from "./strings";

/* =================== THE PLAN: ONE PAGE FOR THE MEETING ===================
   Built around what a caseworker needs for a Bildungsgutschein: goal, fit, what is missing and how to get
   it, the chosen course, job ads as evidence, other routes, next steps. Pure: the state, the data, the page
   as a small block model (rendered as the paper and as plain text). Ported from the previous app (plan.js). */

export const SECTIONS: readonly PlanSection[] = [
  "head",
  "goal",
  "strengths",
  "skills",
  "gaps",
  "course",
  "evidence",
  "other",
  "next",
];
/** Stored as the course when the person picked "None" for this goal (old app versions read it as no course). */
export const NO_COURSE = "none";

export interface PlanState {
  lang: Lang;
  langFor: Lang;
  goal: string;
  course: string;
  courseFor: string;
  inc: Record<PlanSection, boolean>;
  why: string;
  whyAuto: string;
  other: string;
  next: string;
}

/** The plan settings as they apply now. The page follows the rest of the app: it is about the main goal, in
 *  the app's language. A course or page language picked here holds until the goal or the app language changes. */
export function planState(d: Doc, appLang: Lang): PlanState {
  const s = d.summary || {};
  const inc = {} as Record<PlanSection, boolean>;
  SECTIONS.forEach((k) => (inc[k] = s.inc?.[k] ?? true));
  const fresh = !s.lang || s.langFor !== appLang;
  const goal = mainGoal(d)?.id || "";
  let course = s.course || "";
  if (course === NO_COURSE) {
    if (s.courseFor !== goal) course = "";
  } else if (course && (s.courseFor !== goal || !d.courses.some((c) => c.id === course))) course = "";
  if (!course) course = d.courses.find((c) => c.goals.includes(goal))?.id || "";
  return {
    lang: fresh ? appLang : s.lang!,
    langFor: appLang,
    goal,
    course,
    courseFor: goal,
    inc,
    why: s.why || "",
    whyAuto: s.whyAuto || "",
    other: s.other || "",
    next: s.next || "",
  };
}

/* ---------- what goes on the page ---------- */
export interface PlanData {
  s: PlanState;
  L: Lang;
  goal: Job | null;
  apt: string[];
  ints: string[];
  /** the Holland (RIASEC) code of the three strongest interests, e.g. IRA: the shorthand counsellors know */
  intCode: string;
  vals: string[];
  skills: string[];
  gaps: { name: string; via: string }[];
  cnt: JobCount | null;
  course: Course | null;
  ads: JobAd[];
  others: string[];
  wantMore: string[];
  P: Profile;
}
export const pageT = (L: Lang) => makeT(L, strings, courseStrings);

export function planData(d: Doc, E: Esco, s: PlanState): PlanData {
  const L = s.lang;
  const goal = jobById(d, s.goal);
  const apt = strongest(d, L).map((r) => r.name);
  const code = interestCode(d, L);
  const ints = code.map((c) => c.name);
  const intCode = code.map((c) => c.id).join("");
  const vals = assessOf(d)
    .values.map((id) => VALUES.find((x) => x.id === id)?.[L][0] ?? "")
    .filter(Boolean);
  const skn = (x: number) => skIn(E, x, L);
  const all = Object.entries(d.esco.rated);
  let rated = all.filter(([, l]) => l >= 4);
  if (rated.length < 5) rated = all.filter(([, l]) => l >= 3);
  const skills = rated
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([x]) => skn(+x))
    .concat(d.esco.own.filter((o) => o.level >= 3 && o.esco == null).map((o) => o.name))
    .slice(0, 14);
  const course = s.course && s.course !== NO_COURSE ? d.courses.find((c) => c.id === s.course) || null : null;
  let gaps: PlanData["gaps"] = [];
  let cnt: JobCount | null = null;
  if (goal) {
    cnt = jobCount(d, E, goal.occ, goal);
    gaps = cnt.tiles
      .filter((t) => t.state !== "have")
      .slice(0, 10)
      .map((t) => ({
        name: typeof t.x === "number" ? skn(t.x) : t.name,
        via: t.course ? t.course.name : "",
      }));
  }
  const ads = goal ? d.jobads.filter((j) => j.goals.includes(goal.id)).slice(0, 5) : [];
  const others = d.jobs
    .filter((j) => (j.role === "goal" || j.role === "maybe") && (!goal || j.id !== goal.id))
    .map((j) => j.title);
  const want = d.esco.want || {};
  const wantMore = Object.keys(want)
    .filter((x) => want[x] === 1)
    .map((x) => skn(+x));
  return {
    s,
    L,
    goal,
    apt,
    ints,
    intCode,
    vals,
    skills,
    gaps,
    cnt,
    course,
    ads,
    others,
    wantMore,
    P: d.profile,
  };
}

/** A first draft of "Why it fits me", in the page language. */
export function suggestWhy(x: PlanData): string {
  const T = pageT(x.L);
  const out: string[] = [];
  if (x.ints.length) out.push(T("sm_fill_int", { x: x.ints.join(", ") }));
  if (x.apt.length) out.push(T("sm_fill_apt", { x: x.apt.slice(0, 4).join(", ") }));
  if (x.cnt && x.cnt.have) out.push(T("sm_fill_sk", { h: x.cnt.have, t: x.cnt.total }));
  return out.join(" ");
}

/** A suggested start nobody has edited keeps up with the profile, the goal and the page language. */
export function whyNow(x: PlanData): string {
  const s = x.s;
  return s.whyAuto && s.why === s.whyAuto ? suggestWhy(x) : s.why;
}

/* ---------- the page as blocks ---------- */
export type Block =
  | { t: "p"; text: string; lead?: string; tone?: "goal" | "note" | "pending" }
  | {
      t: "list";
      cols?: boolean;
      items: { name: string; strong?: boolean; detail?: string; via?: string; url?: string }[];
    }
  | { t: "table"; rows: [string, string][] };
export interface PageSection {
  k: PlanSection;
  heading: string;
  blocks: Block[];
}
export interface PageModel {
  lang: Lang;
  eyebrow: string;
  title: string;
  /** name and contact line, when the head is included */
  contact: string;
  date: string;
  sections: PageSection[];
}

export function pageModel(x: PlanData, why: string, now: Date): PageModel {
  const { s, L, P } = x;
  const T = pageT(L);
  const inc = s.inc;
  const date = now.toLocaleDateString(L === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sections: PageSection[] = [];
  const sec = (k: PlanSection, blocks: Block[]) => {
    if (inc[k] && blocks.length) sections.push({ k, heading: T(`sm_s_${k}`), blocks });
  };
  const L2 = (k: string) => T(k as Parameters<typeof T>[0]);

  const goal: Block[] = [];
  if (x.goal) {
    goal.push({ t: "p", text: x.goal.title, tone: "goal" });
    if (x.cnt && x.cnt.total)
      goal.push({
        t: "p",
        text: T("sm_progress", { h: x.cnt.have, t: x.cnt.total, c: x.cnt.course }),
        tone: "note",
      });
    if (why) goal.push({ t: "p", text: why });
  }
  sec("goal", goal);

  const st: Block[] = [];
  if (x.apt.length) st.push({ t: "p", lead: T("sm_aptitudes"), text: x.apt.join(", ") });
  if (x.ints.length)
    st.push({
      t: "p",
      lead: T("sm_interest"),
      text: `${x.ints.join(", ")} (${T("sm_holland", { c: x.intCode })})`,
    });
  if (x.vals.length) st.push({ t: "p", lead: T("sm_values"), text: x.vals.join(", ") });
  if (st.length) st.push({ t: "p", text: T("sm_self", { b: BRAND, u: SITE }), tone: "note" });
  sec("strengths", st);

  const sk: Block[] = [];
  if (x.skills.length) sk.push({ t: "p", text: x.skills.join(", ") });
  if (x.wantMore.length) sk.push({ t: "p", lead: T("sm_want"), text: x.wantMore.join(", ") });
  sec("skills", sk);

  sec(
    "gaps",
    x.gaps.length
      ? [
          {
            t: "list",
            cols: true,
            items: x.gaps.map((g) => ({ name: g.name, via: g.via ? T("sm_via", { x: g.via }) : "" })),
          },
        ]
      : [],
  );

  const c = x.course;
  const rows: [string, string | undefined][] = c
    ? [
        ["ce_provider", c.provider],
        ["ce_start", c.start],
        ["ce_length", c.length],
        ["ce_schedule", c.schedule],
        ["ce_format", c.format],
        ["ce_language", c.language],
        ["ce_funding", c.funding],
        ["ce_cert", c.cert],
        ["ce_price", c.price],
        ["ce_azav", c.azav === "provider" ? T("ce_azav_provider") : ""],
        ["ce_url", c.url],
      ]
    : [];
  sec(
    "course",
    c
      ? [
          { t: "p", text: c.name, tone: "goal" },
          { t: "table", rows: rows.filter((r): r is [string, string] => !!r[1]).map(([k, v]) => [L2(k), v]) },
        ]
      : [{ t: "p", text: T("sm_no_course"), tone: "pending" }],
  );

  sec(
    "evidence",
    x.ads.length
      ? [
          {
            t: "list",
            items: x.ads.map((j) => ({
              name: j.name,
              strong: true,
              detail: [j.org, j.place, j.deadline].filter(Boolean).join(", "),
              url: j.url || "",
            })),
          },
        ]
      : [{ t: "p", text: T("sm_no_ads"), tone: "pending" }],
  );

  const other: Block[] = [];
  if (s.other) other.push({ t: "p", text: s.other });
  if (x.others.length) other.push({ t: "p", lead: T("sm_options"), text: x.others.join(", ") });
  sec("other", other);

  sec("next", s.next ? [{ t: "p", text: s.next }] : []);

  return {
    lang: L,
    eyebrow: T("sm_page_title"),
    title: inc.head && P.name ? P.name : x.goal ? x.goal.title : T("sm_page_title"),
    contact: inc.head
      ? [
          P.location,
          P.contact,
          P.german ? T("sm_german") + ": " + L2("g_" + P.german) : "",
          P.computer ? T("sm_computer") + ": " + L2("pc_" + P.computer) : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "",
    date: T("sm_date", { d: date }),
    sections,
  };
}

/** The page as plain text (Markdown-like), for "Copy as text". */
export function pageText(m: PageModel): string {
  const lines: string[] = [m.eyebrow, "# " + m.title];
  if (m.contact) lines.push(m.contact);
  lines.push(m.date);
  for (const s of m.sections) {
    lines.push("", "## " + s.heading);
    for (const b of s.blocks) {
      if (b.t === "p") lines.push((b.lead ? b.lead + ": " : "") + b.text.trim());
      else if (b.t === "table") b.rows.forEach(([k, v]) => lines.push(k + ": " + v));
      else
        b.items.forEach((it) => {
          lines.push(
            "- " + it.name + (it.detail ? ", " + it.detail : "") + (it.via ? " (" + it.via + ")" : ""),
          );
          if (it.url) lines.push("  " + it.url);
        });
    }
  }
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
