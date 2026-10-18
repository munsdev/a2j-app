import type { CSSProperties, ReactNode } from "react";
import { go } from "@/app/router";
import { backToOwn, ownKept, startOwn } from "@/app/samples";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { doInstall, isIOS, isStandalone, useInstall } from "@/app/install";
import { useDoc } from "@/data/store";
import { hasOwnData, jobsIn, mainGoal } from "@/data/doc";
import { partsDone, strongest } from "@/domain/assess";
import { jobCount } from "@/domain/skills";
import { BRAND } from "@/i18n/common";
import { useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Chip, Eyebrow, Icon, LinkButton, Page, SkillBar } from "@/ui";
import { BoardCard } from "@/features/goals/BoardCard";
import { openSamplePicker } from "@/features/backup/sheets";
import { HeroArt } from "./HeroArt";
import { firstName, nextStep, planStarted } from "./model";
import { homeStrings } from "./strings";
import "./home.css";

/* =================== HOME ===================
   One sentence on what you get, three stages (Profile, Goals, Plan) that fill with results as you go, one
   Continue button, and the board once there is a goal. */

/** The entrance: blocks rise in one after the other (i = their place in the order). */
const rise = (i: number, className?: string): { className: string; style: CSSProperties } => ({
  className: cn("home-rise", className),
  style: { ["--i" as string]: i },
});

export default function HomeScreen() {
  const t = useT(homeStrings);
  const lang = useLang();
  const d = useDoc();
  const esco = useEsco();
  const g = mainGoal(d);
  const started = hasOwnData(d) || !!d.example;
  /* the board and the goal's skill count need the catalogue */
  useLoadCatalog(!!g || d.jobs.length > 0);

  const done = partsDone(d);
  const strong = strongest(d, lang).slice(0, 3);
  const linked = !!g && g.occ != null && g.occ >= 0;
  const gc = g && linked && esco ? jobCount(d, esco, g.occ, g) : null;
  const shortlist = jobsIn(d, "maybe").length;
  const plan = planStarted(d);

  return (
    <Page width="wide" className="gap-6 pt-7 pb-10 sm:gap-8 sm:pt-12">
      <Hero started={started} />

      <ol className="grid gap-3 min-[1000px]:grid-cols-3 min-[1000px]:gap-4">
        <Stage
          n={1}
          to="profile"
          title={t("nav_profile")}
          outline={`${t("h_s1")} · ${t("h_t1")}`}
          ok={done === 6}
          i={3}
        >
          {done > 0 && strong.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {strong.map((r) => (
                <Chip key={r.id} tone="have" className="px-2.5 py-1 text-caption">
                  {r.name}
                </Chip>
              ))}
            </span>
          )}
          <Note>{done ? t("h_p_parts", { n: done }) : t("h_p_none")}</Note>
        </Stage>
        <Stage n={2} to="goals" title={t("nav_goals")} outline={`${t("h_s2")} · ${t("h_t2")}`} ok={!!g} i={4}>
          {g ? (
            <>
              <span className="flex items-start gap-1.5 font-extrabold">
                <Icon name="flag" className="mt-0.5 size-4 text-accent-ink" />
                <span className="min-w-0">{g.title}</span>
              </span>
              {gc ? (
                <span className="flex w-full max-w-[300px] flex-col gap-1.5">
                  <Note>{t("h_g_skills", { h: gc.have, t: gc.total })}</Note>
                  <SkillBar
                    have={gc.have}
                    course={gc.course}
                    total={gc.total}
                    label={t("h_g_skills", { h: gc.have, t: gc.total })}
                  />
                </span>
              ) : (
                linked && <SkillsPending />
              )}
            </>
          ) : (
            <Note>{shortlist ? t("h_g_short", { n: shortlist }) : t("h_g_none")}</Note>
          )}
        </Stage>
        <Stage
          n={3}
          to="plan"
          title={t("nav_plan")}
          outline={`${t("h_s3")} · ${t("h_t3")}`}
          ok={!!g && plan}
          i={5}
        >
          <Note>{!g ? t("h_plan_wait") : plan ? t("h_plan_started") : t("h_plan_ready")}</Note>
        </Stage>
      </ol>

      {/* shown straight away: while the catalogue loads, the card holds the board's place */}
      {started && (
        <div {...rise(6)}>
          <BoardCard actions={false} />
        </div>
      )}

      {started && !d.example && !isStandalone() && <InstallCard />}

      <p {...rise(8, "flex items-center justify-center gap-2 text-center text-small text-ink-3")}>
        <Icon name="heart" className="size-4 text-accent-ink" />
        {t("trust")}
      </p>
    </Page>
  );
}

/* ---------- the hero: new visitor, returning visitor, or a sample ---------- */
function Hero({ started }: { started: boolean }) {
  const t = useT(homeStrings);
  const d = useDoc();
  const name = d.profile.name;
  const back = started && !d.example;
  const nx = nextStep(d);

  let text: ReactNode;
  if (d.example)
    text = (
      <>
        <h1 {...rise(0, "text-hero")}>{t("h_sample_h", { x: name })}</h1>
        <p {...rise(1, "max-w-[44ch] text-lead text-ink-2 sm:text-title sm:leading-normal")}>
          {t("h_sample_p")}
        </p>
        <div {...rise(2, "mt-2 flex flex-wrap items-center gap-3")}>
          <Button variant="primary" size="lg" onClick={() => go("goals")}>
            {t("nav_goals")}
            <Icon name="arrow" />
          </Button>
          {ownKept() ? (
            <Button size="lg" onClick={() => backToOwn()}>
              {t("h_sample_back")}
            </Button>
          ) : (
            <Button size="lg" onClick={() => startOwn()}>
              {t("h_sample_own")}
            </Button>
          )}
        </div>
      </>
    );
  else if (back)
    text = (
      <>
        <Eyebrow {...rise(0)}>{BRAND}</Eyebrow>
        <h1 {...rise(0, "text-hero")}>{name.trim() ? t("h_back", { x: firstName(name) }) : t("h_back0")}</h1>
        <div {...rise(1, "mt-3")}>
          <Button variant="primary" size="lg" onClick={() => go(nx.to)}>
            {t("h_cont", { x: t(nx.label) })}
            <Icon name="arrow" />
          </Button>
        </div>
      </>
    );
  else
    text = (
      <>
        <h1 {...rise(0, "max-w-[17ch] text-hero")}>{t("h_title")}</h1>
        <p {...rise(1, "max-w-[46ch] text-lead text-ink-2 sm:text-title sm:leading-normal")}>{t("h_lede")}</p>
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
      </>
    );

  return (
    <section className="grid items-center gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="flex flex-col items-start gap-4">{text}</div>
      {/* Phones and tablets: the picture above the words, centred in the column. On phones only for new
          visitors: with a profile or a sample open, the stage cards come first. */}
      <div
        className={cn(
          "flex w-[min(80%,300px)] max-lg:order-first md:w-[min(100%,460px)] md:justify-self-center lg:w-full lg:justify-end",
          started && "max-md:hidden",
        )}
      >
        <HeroArt className="lg:max-w-[460px]" />
      </div>
    </section>
  );
}

/* ---------- a stage card ---------- */
function Stage({
  n,
  to,
  title,
  outline,
  ok,
  i,
  children,
}: {
  n: number;
  to: string;
  title: string;
  outline: string;
  ok: boolean;
  i: number;
  children: ReactNode;
}) {
  const t = useT(homeStrings);
  return (
    <li {...rise(i, "flex min-w-0")}>
      <a
        href={"#" + to}
        onClick={(e) => {
          e.preventDefault();
          go(to);
        }}
        className="home-stage group grid flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4 rounded-panel bg-surface p-4 text-ink no-underline shadow-card min-[1000px]:grid-cols-[auto_minmax(0,1fr)] min-[1000px]:p-6 sm:p-5"
      >
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-option font-display text-heading font-semibold",
            ok ? "bg-have text-on-accent" : "bg-surface-2 text-ink shadow-ring-soft",
          )}
        >
          {ok ? <Icon name="check" className="size-6 stroke-[2.6]" label={t("done")} /> : n}
        </span>
        <span className="flex min-w-0 flex-col gap-1 pt-0.5">
          <span className="font-display text-title font-semibold">{title}</span>
          <span className="text-small text-ink-2">{outline}</span>
          <span className="mt-2 flex flex-col items-start gap-2">{children}</span>
        </span>
        <Icon name="chev" className="home-stage-go mt-3 self-start text-ink-3 min-[1000px]:hidden" />
      </a>
    </li>
  );
}

const Note = ({ children }: { children: ReactNode }) => (
  <span className="text-small font-bold text-ink-3">{children}</span>
);

/** The goal's skill count while the catalogue loads: the height of the line and the bar it stands for. */
const SkillsPending = () => (
  <span className="flex w-full max-w-[300px] flex-col gap-1.5" aria-hidden="true">
    <span className="flex h-5 items-center">
      <span className="h-3 w-24 animate-pulse rounded-full bg-sunk" />
    </span>
    {/* 6px: the SkillBar's own radius */}
    <span className="h-3 animate-pulse rounded-[6px] bg-sunk" />
  </span>
);

/* ---------- install the app ---------- */
function InstallCard() {
  const t = useT(homeStrings);
  const canInstall = useInstall((s) => !!s.evt);
  return (
    <section
      aria-labelledby="home-inst-h"
      {...rise(7, "flex items-start gap-4 rounded-panel bg-surface p-5 shadow-card sm:p-6")}
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
