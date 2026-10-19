import { useId, useMemo, type CSSProperties, type ReactNode } from "react";
import type { Doc, Job } from "@/data/types";
import { go } from "@/app/router";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { doInstall, isIOS, isStandalone, useInstall } from "@/app/install";
import { useDoc } from "@/data/store";
import { hasOwnData, jobsIn, mainGoal } from "@/data/doc";
import { courseForJob } from "@/data/routes";
import { partsDone } from "@/domain/assess";
import { jobCount, type JobCount } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Eyebrow, Icon, LinkButton, Page } from "@/ui";
import { boardPath, titleForms, type BoardPath } from "@/features/goals/layout";
import { openFinder, openItem } from "@/features/courses/api";
import { openSamplePicker } from "@/features/backup/sheets";
import { HeroArt } from "./HeroArt";
import { countWord, firstName, LINE_STOPS, lineStop, nextStep, planStarted, type LineStop } from "./model";
import { homeStrings } from "./strings";
import "./home.css";

/* =================== HOME ===================
   A new visitor: one sentence on what you get, the line as a picture, Start, and the three stages.
   A returning person (or a sample): their line. How far they are in words ("Four stops done. Eleven to …"),
   the five stops of the whole way (Start · Profile · Goals · Plan · Job) with "You are here", the next stops
   on the line of the route you are on (the next skill and Find a course, then the two after it), and the three stages.
   The full line of the goal is on Goals. */

/** The entrance: blocks rise in one after the other (i = their place in the order). */
const rise = (i: number, className?: string): { className: string; style: CSSProperties } => ({
  className: cn("home-rise", className),
  style: { ["--i" as string]: i },
});

type T = ReturnType<typeof useT<[typeof homeStrings]>>;

/** What Home shows of the person's way: the main goal, its skill count and line (once the catalogue is
 *  there), and where on the five stops they are. */
interface Way {
  g: Job | null;
  gc: JobCount | null;
  p: BoardPath | null;
  /** the goal is in the catalogue (its skills can be counted) */
  linked: boolean;
  here: Exclude<LineStop, "start">;
  done: number;
}
function useWay(d: Doc): Way {
  const esco = useEsco();
  const g = mainGoal(d);
  const linked = !!g && ((g.occ ?? -1) >= 0 || !!(g.extra ?? []).length);
  const gc = useMemo(() => (g && linked && esco ? jobCount(d, esco, g.occ, g) : null), [d, esco, g, linked]);
  /* only the course of the route you are on counts */
  const rc = g ? courseForJob(d, g.id) : null;
  const p = useMemo(() => (g && gc ? boardPath(gc.tiles, rc ? [rc] : []) : null), [g, gc, rc]);
  return { g, gc, p, linked, here: lineStop(d, p?.next.kind === "done"), done: partsDone(d) };
}

/** A job title for a sentence: the first form of a title with two ("Betrugsermittler/Betrugsermittlerin"). */
const short = (title: string): string => titleForms(title)?.[0] ?? title;

export default function HomeScreen() {
  const d = useDoc();
  const started = hasOwnData(d) || !!d.example;
  /* the goal's stops need the catalogue */
  useLoadCatalog(!!mainGoal(d) || d.jobs.length > 0);
  return (
    <Page width="wide" className="gap-6 pt-7 pb-10 sm:gap-8 sm:pt-12">
      {started ? <Returning /> : <Welcome />}
      {started && !d.example && !isStandalone() && <InstallCard />}
      <Trust i={started ? 7 : 6} />
    </Page>
  );
}

function Trust({ i }: { i: number }) {
  const t = useT(homeStrings);
  return (
    <p {...rise(i, "flex items-center justify-center gap-2 text-center text-small text-ink-3")}>
      <Icon name="heart" className="size-4 text-accent-ink" />
      {t("trust")}
    </p>
  );
}

/* ---------- a new visitor ---------- */
function Welcome() {
  const t = useT(homeStrings);
  return (
    <>
      <section className="grid items-center gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-start gap-4">
          <h1 {...rise(0, "max-w-[17ch] text-hero font-extrabold")}>{t("h_title")}</h1>
          <p {...rise(1, "max-w-[46ch] text-lead text-ink-2 sm:text-title sm:leading-normal")}>
            {t("h_lede")}
          </p>
          <div {...rise(2, "mt-2 flex flex-wrap items-center gap-x-2 gap-y-3")}>
            <Button variant="primary" size="lg" className="max-sm:w-full" onClick={() => go("profile/apt")}>
              {t("h_start")}
              <Icon name="arrow" />
            </Button>
            <Button size="lg" className="max-sm:w-full" onClick={() => openSamplePicker()}>
              {t("h_sample")}
            </Button>
          </div>
          <LinkButton onClick={() => go("backup/restore")} {...rise(3, "min-h-11 text-small")}>
            {t("h_restore")}
          </LinkButton>
        </div>
        {/* phones and tablets: the picture above the words, centred in the column */}
        <div className="flex w-[min(100%,340px)] justify-self-center max-lg:order-first md:w-[min(100%,460px)] lg:w-full lg:justify-end">
          <HeroArt here={t("l_here")} className="lg:max-w-[460px]" />
        </div>
      </section>
      <Stages i={4} fresh />
    </>
  );
}

/* ---------- a returning person, or a sample ---------- */
function Returning() {
  const t = useT(homeStrings);
  const d = useDoc();
  const way = useWay(d);
  const name = firstName(d.profile.name);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Eyebrow {...rise(0)}>{name ? t("l_line", { x: name }) : t("l_line0")}</Eyebrow>
        <h1 {...rise(0, "max-w-[24ch] text-hero font-extrabold")}>{headline(t, way)}</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div {...rise(1, "flex min-w-0 flex-col gap-4")}>
          <OverviewLine way={way} initial={name.charAt(0).toUpperCase()} />
        </div>
        <div {...rise(2, "min-w-0 lg:row-span-2")}>
          <NextStops way={way} />
        </div>
        <div className="min-w-0">
          <Stages i={3} way={way} />
        </div>
      </div>
    </>
  );
}

/** "Four stops done. Eleven to Fraud investigator.": the stops are the goal's skills. Without a goal, or
 *  before the catalogue is there, where the line goes next. */
function headline(t: T, { g, gc, here }: Way): string {
  if (g && gc && gc.total > 0) {
    const nums = t("l_nums");
    const x = short(g.title);
    const left = gc.total - gc.have;
    const done =
      gc.have === 0
        ? t("l_done0")
        : gc.have === 1
          ? t("l_done1")
          : t("l_done", { n: countWord(gc.have, nums, true) });
    /* English starts the second sentence with the count ("Eleven to …"), German with "Noch" */
    const ahead =
      left === 0
        ? t("l_left0", { x })
        : left === 1
          ? t("l_left1", { x })
          : t("l_left", { n: countWord(left, nums, t("l_left").startsWith("{n}")), x });
    return done + " " + ahead;
  }
  if (g) return t("l_to", { x: short(g.title) });
  return here === "profile" ? t("l_next_profile") : t("l_next_goal");
}

/* ---------- the five stops of the whole way ---------- */
function OverviewLine({ way, initial }: { way: Way; initial: string }) {
  const t = useT(homeStrings);
  const d = useDoc();
  const headId = useId();
  const { g, gc, here, done } = way;
  const at = LINE_STOPS.indexOf(here);
  const plan = planStarted(d);
  const arrived = here === "job";
  const stops: { k: LineStop; name: string; sub: string; ok: boolean }[] = [
    { k: "start", name: t("l_start"), sub: "", ok: false },
    { k: "profile", name: t("nav_profile"), sub: t("l_of", { h: done, t: 6 }), ok: done === 6 },
    {
      k: "goals",
      name: t("nav_goals"),
      sub: gc && gc.total ? t("l_of", { h: gc.have, t: gc.total }) : g ? "" : t("l_none"),
      ok: !!g && at > 2,
    },
    {
      k: "plan",
      name: t("nav_plan"),
      sub: !g ? t("l_later") : plan ? t("l_started") : t("l_ready"),
      ok: !!g && plan && at > 3,
    },
    { k: "job", name: t("l_job"), sub: t("l_goal"), ok: arrived },
  ];
  const lit = (at / 4) * 80; // the track runs from the first stop's centre (10%) to the last one's (90%)
  return (
    <section
      aria-labelledby={headId}
      className="rounded-panel bg-surface px-3.5 pt-8 pb-4 shadow-card sm:px-5"
    >
      <h2 id={headId} className="sr-only">
        {t("l_line0")}
      </h2>
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute top-[13px] right-[10%] left-[10%] h-1.5 rounded-full bg-line-2"
        />
        <span
          aria-hidden="true"
          className="hl-lit absolute top-[13px] left-[10%] h-1.5 rounded-full bg-have"
          style={{ width: lit + "%" }}
        />
        <ol className="relative grid grid-cols-5">
          {stops.map((s, i) => (
            <li key={s.k} className="relative flex min-w-0 flex-col items-center gap-1.5 text-center">
              {s.k === here && (
                <span className="hl-here absolute -top-6 left-1/2 -translate-x-1/2 rounded-[6px] bg-ink px-1.5 py-0.5 text-[0.6875rem] leading-tight font-bold whitespace-nowrap text-canvas">
                  {t("l_here")}
                </span>
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-full border-4 font-display text-caption leading-none font-extrabold",
                  s.k === "job" ? "w-11 text-[0.6875rem]" : "w-8",
                  s.k === "job"
                    ? arrived
                      ? "border-have bg-have text-on-accent"
                      : "border-ink bg-ink text-canvas"
                    : s.k === here
                      ? "border-ink bg-surface text-ink"
                      : s.ok
                        ? "border-have bg-have text-on-accent"
                        : i < at
                          ? "border-have bg-surface text-ink"
                          : "border-line-2 bg-surface text-ink",
                )}
              >
                {s.k === "start" ? (
                  "A"
                ) : s.k === "job" ? (
                  "Job"
                ) : s.k === here ? (
                  initial || <Icon name="person" className="size-3.5 stroke-[2.6]" />
                ) : s.ok ? (
                  <Icon name="check" className="size-4 stroke-[3]" />
                ) : null}
              </span>
              <b className="max-w-full font-display text-label leading-tight font-bold break-words">
                {s.name}
              </b>
              {s.sub && <span className="text-caption leading-tight text-ink-3">{s.sub}</span>}
              {s.ok && <span className="sr-only">{t("done")}</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- the next stops on the goal's line ---------- */
function NextStops({ way }: { way: Way }) {
  const t = useT(homeStrings);
  const d = useDoc();
  const headId = useId();
  const { g, p, linked, gc } = way;
  const nx = nextStep(d);
  const n = p?.next;
  const loading = !!g && linked && !gc;

  let now: ReactNode;
  let then: string[] = [];
  if (loading)
    now = (
      <span className="flex flex-col gap-3" aria-hidden="true">
        <span className="h-6 w-3/4 animate-pulse rounded-tile bg-canvas/15 dark:bg-surface-2" />
        <span className="h-12 w-40 animate-pulse rounded-control bg-canvas/15 dark:bg-surface-2" />
      </span>
    );
  else if (g && n?.kind === "skill") {
    now = (
      <Now
        title={n.tile.name}
        action={
          <NowButton onClick={() => openFinder("course", g.id, n.tile.x)}>
            <Icon name="search" />
            {t("n_find")}
          </NowButton>
        }
      />
    );
    then = p!.learn.slice(1, 3).map((x) => x.name);
  } else if (g && n?.kind === "course")
    now = (
      <Now
        eyebrow={t("n_course")}
        title={n.course.name}
        action={
          <NowButton onClick={() => openItem("course", n.course.id, g.id)}>
            <Icon name="book" />
            {t("n_open")}
          </NowButton>
        }
      />
    );
  else if (g && n?.kind === "done")
    now = (
      <Now
        title={t("n_all")}
        action={
          <NowButton onClick={() => openFinder("jobad", g.id)}>
            <Icon name="bag" />
            {t("n_ads")}
          </NowButton>
        }
      />
    );
  else
    now = (
      <Now
        title={t(nx.label === "nav_profile" ? "h_s1" : nx.label === "nav_goals" ? "h_s2" : "h_s3")}
        action={
          <NowButton onClick={() => go(nx.to)}>
            {t("h_cont", { x: t(nx.label) })}
            <Icon name="arrow" />
          </NowButton>
        }
      />
    );

  return (
    <section
      aria-labelledby={headId}
      aria-busy={loading || undefined}
      className="flex flex-col rounded-panel bg-ink p-4 text-canvas sm:p-5 dark:bg-sunk dark:text-ink dark:shadow-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-canvas/20 pb-2.5 dark:border-line">
        <h2 id={headId} className="font-display text-label font-extrabold tracking-[.06em] uppercase">
          {t("n_title")}
        </h2>
        {g && (
          <span className="min-w-0 text-small text-canvas/75 dark:text-ink-3">
            {t("n_to", { x: short(g.title) })}
          </span>
        )}
      </div>
      <div className={cn("flex flex-col gap-2.5 pt-3.5", then.length ? "pb-3" : "pb-1")}>
        <span className="text-caption font-bold tracking-[.06em] text-have-bg uppercase dark:text-have-ink">
          {t("n_now")}
        </span>
        {now}
      </div>
      {then.length > 0 && (
        <ul className="border-t border-canvas/20 pt-1.5 dark:border-line">
          {then.map((x, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 py-1.5 text-label">
              <span className="min-w-0">{x}</span>
              <span className="flex-none text-small text-canvas/75 dark:text-ink-3">{t("n_then")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Now({ eyebrow, title, action }: { eyebrow?: string; title: string; action: ReactNode }) {
  return (
    <>
      {eyebrow && <span className="-mt-1.5 text-small text-canvas/75 dark:text-ink-3">{eyebrow}</span>}
      <b className="font-display text-heading leading-tight font-extrabold">{title}</b>
      <div className="mt-0.5">{action}</div>
    </>
  );
}

/** The one light button on the dark panel (in the dark theme: the usual primary). */
const NowButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <Button
    onClick={onClick}
    className="bg-surface text-ink shadow-none hover:bg-canvas dark:bg-ink dark:text-canvas dark:hover:bg-ink-2"
  >
    {children}
  </Button>
);

/* ---------- the three stages ---------- */
function Stages({ i, way, fresh }: { i: number; way?: Way; fresh?: boolean }) {
  const t = useT(homeStrings);
  const d = useDoc();
  const g = way?.g ?? null;
  const gc = way?.gc ?? null;
  const done = partsDone(d);
  const plan = planStarted(d);
  const shortlist = jobsIn(d, "maybe").length;
  const here = way?.here;
  const rows: { n: number; to: string; title: string; sub: string; ok: boolean; at: boolean }[] = fresh
    ? [
        {
          n: 1,
          to: "profile",
          title: t("nav_profile"),
          sub: `${t("h_s1")} · ${t("h_t1")}`,
          ok: false,
          at: false,
        },
        {
          n: 2,
          to: "goals",
          title: t("nav_goals"),
          sub: `${t("h_s2")} · ${t("h_t2")}`,
          ok: false,
          at: false,
        },
        { n: 3, to: "plan", title: t("nav_plan"), sub: `${t("h_s3")} · ${t("h_t3")}`, ok: false, at: false },
      ]
    : [
        {
          n: 1,
          to: "profile",
          title: t("nav_profile"),
          sub: done === 6 ? t("s_p_all") : done ? t("h_p_parts", { n: done }) : t("h_p_none"),
          ok: done === 6,
          at: here === "profile",
        },
        {
          n: 2,
          to: "goals",
          title: t("nav_goals"),
          sub: g
            ? gc && gc.total
              ? t("s_g_stop", { x: short(g.title), h: gc.have, t: gc.total })
              : short(g.title)
            : shortlist
              ? t("h_g_short", { n: shortlist })
              : t("h_g_none"),
          ok: !!g && (here === "plan" || here === "job"),
          at: here === "goals",
        },
        {
          n: 3,
          to: "plan",
          title: t("nav_plan"),
          sub: !g ? t("h_plan_wait") : plan ? `${t("h_s3")} · ${t("h_plan_started")}` : t("h_s3"),
          ok: !!g && plan && here === "job",
          at: here === "plan",
        },
      ];
  return (
    <nav aria-label={t("s_title")}>
      <ol className={cn("grid gap-2", fresh && "min-[1000px]:grid-cols-3 min-[1000px]:gap-3")}>
        {rows.map((r, k) => (
          <li key={r.to + r.n} {...rise(i + k, "flex min-w-0")}>
            <a
              href={"#" + r.to}
              aria-current={r.at ? "step" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(r.to);
              }}
              className="home-stage flex min-h-16 flex-1 items-center gap-3.5 rounded-option bg-surface px-3.5 py-3 text-ink no-underline shadow-card"
            >
              <span
                className={cn(
                  "flex size-[38px] flex-none items-center justify-center rounded-full border-4 font-display text-label font-extrabold",
                  r.ok
                    ? "border-have bg-have text-on-accent"
                    : r.at
                      ? "border-ink bg-surface text-ink"
                      : "border-line-2 bg-surface text-ink-2",
                )}
              >
                {r.ok ? <Icon name="check" className="size-[18px] stroke-[3]" label={t("done")} /> : r.n}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-[1.125rem] leading-tight font-extrabold">{r.title}</span>
                <span className="text-small text-ink-2">{r.sub}</span>
              </span>
              <Icon name="chev" className="home-stage-go flex-none text-ink-2" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- install the app ---------- */
function InstallCard() {
  const t = useT(homeStrings);
  const canInstall = useInstall((s) => !!s.evt);
  return (
    <section
      aria-labelledby="home-inst-h"
      {...rise(6, "flex items-start gap-4 rounded-panel bg-surface p-5 shadow-card sm:p-6")}
    >
      <span className="flex size-12 flex-none items-center justify-center rounded-option bg-accent-soft text-accent-ink">
        <Icon name="bag" className="size-6" />
      </span>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <h2 id="home-inst-h" className="text-title">
          {t("inst_h")}
        </h2>
        <p className="max-w-[60ch] text-ink-2">{t("inst_p")}</p>
        {canInstall ? (
          <Button size="sm" className="mt-1.5" onClick={() => void doInstall()}>
            <Icon name="download" />
            {t("inst_btn")}
          </Button>
        ) : (
          <p className="text-small text-ink-3">{t(isIOS() ? "inst_ios" : "inst_other")}</p>
        )}
      </div>
    </section>
  );
}
