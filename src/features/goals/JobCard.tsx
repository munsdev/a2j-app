import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Job } from "@/data/types";

import { jobForOcc, lc, mainGoal } from "@/data/doc";
import { useDoc } from "@/data/store";
import { useEscoReady, useOnet } from "@/app/catalog";
import { occLabel, skLabel } from "@/domain/catalog";
import { type Idea, distinct, warnings, zoneOf } from "@/domain/rank";
import { jobCount, type Tile } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon, LinkButton, SkillTile, Tag, TileGrid, TileLegend } from "@/ui";
import { HalfMark } from "@/features/routes/parts";
import { FitBlock } from "./Fit";
import { useMatch } from "./useFit";
import { Title } from "./Title";
import { cardKey, toggleFlip, useFlipped } from "./store";
import { openSkill } from "./openSkill";
import { strings } from "./strings";
import "./card.css";

/* =================== THE JOB CARD ===================
   Front: what the job is and how well it matches (one score, two reasons: interests and skills). Back: its
   skills as tiles (have, a saved course covers it, still to learn). Tapping the front turns the card over; the
   flip button does the same and is the way for keyboards. Flat (job ideas): one side only, with the skills on
   it as chips, nothing to turn over. */

export interface JobCardProps {
  /** catalogue occupation, -1 when not in the catalogue */
  occ: number;
  job?: Job | null;
  /** the ranking row, on job ideas */
  idea?: Idea | null;
  /** one side only, with the skills on it as chips (job ideas): nothing to turn over */
  flat?: boolean;
  /** stretch to the height of its row (cards side by side) */
  fill?: boolean;
  /** play the deal-in animation when the card appears */
  deal?: boolean;
  /** the card's title is the page's h1 (the job page) */
  main?: boolean;
  /** job ideas: how the person marked this idea (shown as a tag on the front) */
  mark?: IdeaMark;
}
/** How an idea is marked: on the shortlist, one of the goals, not for me, or not at all. */
export type IdeaMark = "like" | "goal" | "no" | null;

export function JobCard({ occ, job, idea, flat, fill, deal, main, mark }: JobCardProps) {
  const E = useEscoReady();
  const key = cardKey(occ, job?.id);
  const flipped = useFlipped(key) && !flat;
  const title = job ? job.title : occLabel(E, occ);
  const own = useHeightTween(flipped, !fill && !flat);
  const onFront = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    toggleFlip(key);
  };
  if (flat)
    return (
      <article ref={own} className="card3d" aria-label={title} data-card={key} data-deal={deal || undefined}>
        <div className="face front">
          <CardFront occ={occ} job={job ?? null} idea={idea ?? null} main={!!main} mark={mark ?? null} flat />
        </div>
      </article>
    );
  return (
    <article
      ref={own}
      className="card3d"
      aria-label={title}
      data-card={key}
      data-flipped={flipped || undefined}
      data-fill={fill || undefined}
      data-deal={deal || undefined}
    >
      <div className="face front" aria-hidden={flipped || undefined} inert={flipped} onClick={onFront}>
        <CardFront occ={occ} job={job ?? null} idea={idea ?? null} main={!!main} mark={mark ?? null} />
      </div>
      <div className="face back" aria-hidden={!flipped || undefined} inert={!flipped}>
        <CardBack occ={occ} job={job ?? null} main={!!main} />
      </div>
    </article>
  );
}

/* The face you see sets the height, so turning the card changes it: tween it, so what is below slides. */
function useHeightTween(flipped: boolean, on: boolean) {
  const el = useRef<HTMLElement | null>(null);
  /* the height the card had before this render, kept up to date while no tween runs */
  const last = useRef<number | null>(null);
  const tweening = useRef(false);
  useLayoutEffect(() => {
    const node = el.current;
    if (!node || !on) return;
    const ro = new ResizeObserver(() => {
      if (!tweening.current) last.current = node.offsetHeight;
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [on]);
  useLayoutEffect(() => {
    const node = el.current;
    if (!node || !on) return;
    const to = node.offsetHeight;
    const from = last.current;
    last.current = to;
    if (from == null || Math.abs(from - to) < 1 || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    tweening.current = true;
    node.style.height = from + "px";
    void node.offsetHeight; // commit the old height before tweening to the new one
    node.style.transition = "height 0.6s var(--ease-flip), translate 0.2s, rotate 0.2s, opacity 0.2s";
    node.style.height = to + "px";
    const done = () => {
      node.style.height = "";
      node.style.transition = "";
      tweening.current = false;
    };
    const timer = setTimeout(done, 650);
    return () => {
      clearTimeout(timer);
      // turned again mid-way: the next tween starts from where this one is now
      last.current = node.getBoundingClientRect().height;
      done();
    };
  }, [flipped, on]);
  return el;
}

/* ---------- the front ---------- */
function CardFront({
  occ,
  job,
  idea,
  main,
  mark,
  flat,
}: {
  occ: number;
  job: Job | null;
  idea: Idea | null;
  main: boolean;
  mark: IdeaMark;
  /** one side: the skills as chips, and no "tap to turn over" */
  flat?: boolean;
}) {
  const t = useT(strings);
  const E = useEscoReady();
  const O = useOnet();
  const d = useDoc();
  const m = useMatch(occ, job);
  const title = job ? job.title : occLabel(E, occ);
  const isMain = job ? job.id === mainGoal(d)?.id : mark === "goal" && mainGoal(d)?.occ === occ;
  const info = useMemo(() => {
    if (occ < 0) return null;
    const why: string[] = [];
    if (idea && (idea.like ?? 0) >= 0.2 && idea.likeOf != null && idea.likeOf !== occ)
      why.push(t("c_like", { x: occLabel(E, idea.likeOf) }));
    if (idea?.wantUp?.length)
      why.push(
        t("c_up", {
          x: idea.wantUp
            .slice(0, 2)
            .map((x) => skLabel(E, x))
            .join(", "),
        }),
      );
    return {
      zone: zoneOf(O, occ),
      doing: distinct(E, occ, 3).map((x) => skLabel(E, x)),
      why,
      dn: idea?.wantDn?.length
        ? t("c_dn", {
            x: idea.wantDn
              .slice(0, 2)
              .map((x) => skLabel(E, x))
              .join(", "),
          })
        : "",
      warn: warnings(d, O, occ),
    };
  }, [d, E, O, occ, idea, t]);

  const tags = (
    <div className="flex flex-wrap gap-1.5">
      {job?.role === "goal" || mark === "goal" ? (
        <Tag tone="goal">
          <Icon name="flag" />
          {t(isMain ? "g_main" : "g_goal")}
        </Tag>
      ) : job?.role === "maybe" || mark === "like" ? (
        <Tag tone="like">
          <Icon name="up" />
          {t("c_liked")}
        </Tag>
      ) : mark === "no" ? (
        <Tag tone="no">
          <Icon name="up" flip />
          {t("c_no")}
        </Tag>
      ) : null}
      {info?.zone != null && <Tag>{t(`z${info.zone}`)}</Tag>}
    </div>
  );
  /* one-off size between heading and display, one step down (heading) on phones */
  const H = main ? "h1" : "h3";
  const heading = (
    <H className="text-heading sm:text-[1.875rem] sm:leading-[1.12]">
      <Title text={title} split />
    </H>
  );
  const fit = m && <FitBlock m={m} main={isMain} />;
  if (!info)
    return (
      <div className={cn("flex min-h-full flex-col gap-3.5 p-5 pb-[22px]", !flat && "cursor-pointer")}>
        {tags}
        {heading}
        {fit ?? <p className="text-small text-ink-3">{t("d_custom")}</p>}
      </div>
    );
  return (
    <div className={cn("flex min-h-full flex-col gap-3.5 p-5 pb-[22px]", !flat && "cursor-pointer")}>
      {tags}
      <div className="flex flex-col gap-1">
        {heading}
        {job && lc(job.title) !== lc(occLabel(E, occ)) && (
          <p className="text-small break-words text-ink-3">
            <Title text={occLabel(E, occ)} />
          </p>
        )}
      </div>
      {info.doing.length > 0 && (
        <p className="text-label leading-normal text-ink-2">
          <b className="text-ink">{t("c_doing")}:</b> {info.doing.join(", ")}
        </p>
      )}
      {fit}
      {flat && <SkillChips occ={occ} job={job} />}
      {info.why.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-small font-semibold text-ink-2">
          {info.why.map((w) => (
            <li key={w} className="flex items-start gap-2">
              <Icon name="heart" className="mt-px size-4 flex-none text-have" />
              {w}
            </li>
          ))}
        </ul>
      )}
      {info.dn && <p className="text-small font-semibold text-no">{info.dn}</p>}
      {info.warn.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {info.warn.map((w) => (
            <Tag key={w}>
              <Icon name="warn" className="text-have-ink" />
              {t(w)}
            </Tag>
          ))}
        </div>
      )}
      {m?.rough && <p className="text-small text-ink-3">{t("c_rough")}</p>}
    </div>
  );
}

/* ---------- the back ---------- */
function CardBack({ occ, job, main }: { occ: number; job: Job | null; main: boolean }) {
  const t = useT(strings);
  const E = useEscoReady();
  const d = useDoc();
  const title = job ? job.title : occLabel(E, occ);
  const tiles = useMemo(() => jobCount(d, E, occ, job).tiles, [d, E, occ, job]);
  const H = main ? "h1" : "h3";
  return (
    <div className="flex flex-col gap-3 p-[18px]">
      <div className="flex flex-col gap-2">
        <H className="text-title">
          <Title text={title} split />
        </H>
        {tiles.length > 0 && <TileLegend />}
      </div>
      {tiles.length === 0 ? (
        <p className="text-small text-ink-3">{t("d_custom")}</p>
      ) : (
        <TileGrid>
          {tiles.map((tile) => (
            <SkillTile
              key={tile.key}
              name={tile.name}
              state={tile.state}
              data-tile=""
              onClick={() => openSkill(tile.x, occ, job?.id ?? jobForOcc(d, occ)?.id ?? null)}
            />
          ))}
        </TileGrid>
      )}
    </div>
  );
}

/* ---------- the skills as chips (job ideas: one side, nothing to turn over) ---------- */
const CHIPS_SHOWN = 10;
const CHIP: Record<Tile["state"], string> = {
  have: "bg-have-bg text-have-ink",
  some: "bg-have-bg text-have-ink",
  course: "bg-course-bg text-course-ink shadow-[inset_0_0_0_1.5px_var(--course)]",
  learn: "bg-surface text-ink-2 outline-[1.5px] -outline-offset-[1.5px] outline-learn outline-dashed",
};

/** The job's core skills, each in its state (have, some, the course covers it, still to learn) and told apart
 *  by its mark as well as its colour. A chip opens the skill's sheet, where the person can rate it. */
function SkillChips({ occ, job }: { occ: number; job: Job | null }) {
  const t = useT(strings);
  const E = useEscoReady();
  const d = useDoc();
  const tiles = useMemo(() => jobCount(d, E, occ, job).tiles, [d, E, occ, job]);
  const [all, setAll] = useState(false);
  if (!tiles.length) return null;
  const shown = all ? tiles : tiles.slice(0, CHIPS_SHOWN);
  const jobId = job?.id ?? jobForOcc(d, occ)?.id ?? null;
  return (
    <section className="flex flex-col gap-2" aria-label={t("c_skills_h")}>
      <p className="text-label font-extrabold">{t("c_skills_h")}</p>
      <ul className="flex flex-wrap gap-1.5">
        {shown.map((tile) => (
          <li key={tile.key}>
            <button
              type="button"
              data-tile=""
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 text-left text-small leading-tight font-bold [&_svg]:size-3.5 [&_svg]:stroke-[2.8]",
                CHIP[tile.state],
              )}
              onClick={() => openSkill(tile.x, occ, jobId)}
            >
              <span aria-hidden="true" className="flex">
                {tile.state === "have" ? (
                  <Icon name="check" />
                ) : tile.state === "some" ? (
                  <HalfMark />
                ) : tile.state === "course" ? (
                  <Icon name="book" />
                ) : null}
              </span>
              <span className="break-words hyphens-auto">{tile.name}</span>
              <span className="sr-only">, {t(`c_legend_${tile.state}`)}</span>
            </button>
          </li>
        ))}
      </ul>
      {tiles.length > shown.length && (
        <LinkButton className="self-start text-small" onClick={() => setAll(true)}>
          {t("c_more_sk", { n: tiles.length - shown.length })}
        </LinkButton>
      )}
      <TileLegend className="mt-0.5" />
    </section>
  );
}
