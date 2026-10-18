import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Job } from "@/data/types";

import { jobForOcc, lc, mainGoal } from "@/data/doc";
import { update, useDoc } from "@/data/store";
import { useEscoReady, useOnet } from "@/app/catalog";
import { occLabel, skLabel } from "@/domain/catalog";
import { type Idea, distinct, setSkillVote, skillVote, warnings, zoneOf } from "@/domain/rank";
import { jobCount, type Tile } from "@/domain/skills";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon, LinkButton, SkillTile, Tag, TileGrid, TileLegend } from "@/ui";
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
   flip button does the same and is the way for keyboards. In rating mode (job ideas, after a thumb) the back
   lists the skills as rows with two buttons each: "I like this" and "Rather not". */

export interface JobCardProps {
  /** catalogue occupation, -1 when not in the catalogue */
  occ: number;
  job?: Job | null;
  /** the ranking row, on job ideas */
  idea?: Idea | null;
  rate?: boolean;
  /** stretch to the height of its row (cards side by side) */
  fill?: boolean;
  /** play the deal-in animation when the card appears */
  deal?: boolean;
  /** the card's title is the page's h1 (the job page) */
  main?: boolean;
}

export function JobCard({ occ, job, idea, rate, fill, deal, main }: JobCardProps) {
  const E = useEscoReady();
  const key = cardKey(occ, job?.id);
  const flipped = useFlipped(key) || !!rate;
  const title = job ? job.title : occLabel(E, occ);
  const own = useHeightTween(flipped, !fill);
  const onFront = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    toggleFlip(key);
  };
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
        <CardFront occ={occ} job={job ?? null} idea={idea ?? null} main={!!main} />
      </div>
      <div className="face back" aria-hidden={!flipped || undefined} inert={!flipped}>
        <CardBack occ={occ} job={job ?? null} rate={!!rate} main={!!main} />
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
}: {
  occ: number;
  job: Job | null;
  idea: Idea | null;
  main: boolean;
}) {
  const t = useT(strings);
  const E = useEscoReady();
  const O = useOnet();
  const d = useDoc();
  const m = useMatch(occ, job);
  const title = job ? job.title : occLabel(E, occ);
  const isMain = !!job && job.id === mainGoal(d)?.id;
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
      {job?.role === "goal" ? (
        <Tag tone="goal">
          <Icon name="flag" />
          {t(isMain ? "g_main" : "g_goal")}
        </Tag>
      ) : job?.role === "maybe" ? (
        <Tag tone="like">
          <Icon name="up" />
          {t("c_liked")}
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
      <div className="flex min-h-full cursor-pointer flex-col gap-3.5 p-5 pb-[22px]">
        {tags}
        {heading}
        {fit ?? <p className="text-small text-ink-3">{t("d_custom")}</p>}
      </div>
    );
  return (
    <div className="flex min-h-full cursor-pointer flex-col gap-3.5 p-5 pb-[22px]">
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
function CardBack({ occ, job, rate, main }: { occ: number; job: Job | null; rate: boolean; main: boolean }) {
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
        {rate ? (
          <p className="rounded-tile bg-surface-2 px-3 py-2.5 text-small text-ink-2">
            <b className="text-ink">{t("c_rate_opt")}</b> {t("c_rate_hint")}
          </p>
        ) : (
          tiles.length > 0 && <TileLegend />
        )}
      </div>
      {tiles.length === 0 ? (
        <p className="text-small text-ink-3">{t("d_custom")}</p>
      ) : rate ? (
        <VoteRows occ={occ} tiles={tiles} />
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

/* ---------- rating mode: a row per skill, "I like this" and "Rather not" ---------- */
const ROWS_SHOWN = 8;

function VoteRows({ occ, tiles }: { occ: number; tiles: Tile[] }) {
  const t = useT(strings);
  const [all, setAll] = useState(false);
  const shown = all ? tiles : tiles.slice(0, ROWS_SHOWN);
  return (
    <>
      <ul className="flex flex-col gap-2">
        {shown.map((tile) => (
          <VoteRow key={tile.key} occ={occ} tile={tile} />
        ))}
      </ul>
      {tiles.length > shown.length && (
        <LinkButton className="text-small" onClick={() => setAll(true)}>
          {t("c_more_sk", { n: tiles.length - shown.length })}
        </LinkButton>
      )}
    </>
  );
}

function VoteRow({ occ, tile }: { occ: number; tile: Tile }) {
  const t = useT(strings);
  const x = tile.x;
  const vote = useDoc((d) => (typeof x === "number" ? skillVote(d, occ, x) : 0));
  /* the saves are quiet: Next (or leaving) makes this card's thumbs one undo step */
  const set = (dir: 1 | -1) => {
    if (typeof x !== "number") return;
    update((dr) => setSkillVote(dr, occ, x, vote === dir ? 0 : dir), { quiet: true });
  };
  const btn =
    "flex size-11 flex-none items-center justify-center rounded-tile transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 [&_svg]:size-5";
  const off = "bg-surface text-ink-3 shadow-ring hover:text-ink hover:shadow-ring-strong";
  return (
    <li
      className={cn(
        "grid min-h-[60px] grid-cols-[20px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-control py-2 pr-2 pl-2.5",
        tile.state === "have" && "bg-have-bg text-have-ink",
        tile.state === "course" && "bg-course-bg text-course-ink shadow-[inset_0_0_0_1.5px_var(--course)]",
        tile.state === "learn" &&
          "bg-surface text-ink-2 outline-[1.5px] -outline-offset-[1.5px] outline-learn outline-dashed",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 items-center justify-center rounded-full [&_svg]:size-3.5 [&_svg]:stroke-[2.6]",
          tile.state === "have" && "bg-have text-on-accent",
          tile.state === "course" && "bg-course text-white",
          tile.state === "learn" && "shadow-[inset_0_0_0_2px_var(--line-2)]",
        )}
      >
        {tile.state === "have" ? (
          <Icon name="check" />
        ) : tile.state === "course" ? (
          <Icon name="book" />
        ) : null}
      </span>
      <span className="text-small leading-tight font-bold break-words hyphens-auto">
        {tile.name}
        <span className="sr-only">
          {", "}
          {t(
            tile.state === "have"
              ? "c_legend_have"
              : tile.state === "course"
                ? "c_legend_course"
                : "c_legend_learn",
          )}
        </span>
      </span>
      {typeof x === "number" && (
        <>
          <button
            type="button"
            aria-pressed={vote > 0}
            aria-label={t("c_vote_up", { x: tile.name })}
            data-vote="up"
            className={cn(btn, vote > 0 ? "bg-yes text-on-yes" : off)}
            onClick={() => set(1)}
          >
            <Icon name="up" />
          </button>
          <button
            type="button"
            aria-pressed={vote < 0}
            aria-label={t("c_vote_dn", { x: tile.name })}
            data-vote="down"
            className={cn(btn, vote < 0 ? "bg-no text-on-no" : off)}
            onClick={() => set(-1)}
          >
            <Icon name="up" flip />
          </button>
        </>
      )}
    </li>
  );
}
