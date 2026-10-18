import { useEffect, useEffectEvent, useMemo, useRef, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { addJob, jobForOcc, removeJob } from "@/data/doc";
import { commit, getDoc, update, useDoc } from "@/data/store";
import { useCommitOnLeave } from "@/data/hooks";
import { isShortcutBlocked } from "@/lib/keys";
import { focusForStep } from "@/lib/focus";
import { useEscoReady, useOnet } from "@/app/catalog";
import { go } from "@/app/router";
import { toast } from "@/app/toast";
import { useProfileEpoch } from "@/app/samples";
import { loadOnet, occLabel } from "@/domain/catalog";
import { type Idea, type Zone, canRank, rankAll, setVote, voteOf } from "@/domain/rank";
import { useT } from "@/i18n";
import { ActionBar, Button, EmptyState, Icon, LinkButton, Page, RunHeader, Select } from "@/ui";
import { JobCard } from "./JobCard";
import { dealHand, deckIndex, ideaSlots } from "./layout";
import { cardKey, ideaRows, setFlip, toggleFlip, useFlipped, useGoals, useViewportWidth } from "./store";
import { usePointerSwipe } from "./usePointerSwipe";
import { strings } from "./strings";

/* =================== JOB IDEAS: A DECK OF CARDS ===================
   A stable ranked list for the visit (voting does not reshuffle it). 👍 puts the job on the shortlist, 👎 takes
   it out of the ideas; either way the card turns over so single skills can be rated (optional), then Next.
   Skip passes over an idea; skipped ideas come back at the end. Phones get one big card on a stack; tablets
   and computers two or three side by side. Keys: → like, ← not for me, ↓ skip, space turns the card; while
   rating, → or Enter goes on. Swipe a card sideways to skip it, or once voted on to go to the next one. */

const ZONES = [1, 2, 3, 4] as const;
type FocusAim = { what: "next"; occ: number } | { what: "yes" } | null;

export function Ideas() {
  useCommitOnLeave();
  const t = useT(strings);
  const d = useDoc();
  const E = useEscoReady();
  const O = useOnet();
  const w = useViewportWidth();
  const epoch = useProfileEpoch((s) => s.epoch);
  const st = useGoals(
    useShallow((s) => ({
      zone: s.zone,
      deckKey: s.deckKey,
      idx: s.idx,
      skip: s.skip,
      rating: s.rating,
      last: s.last,
    })),
  );
  const ranks = canRank(d);

  /* preparation levels come with the O*NET file: without it there is nothing to filter by */
  const zones = !!O?.z;
  const zone: Zone | 0 = zones ? st.zone : 0;
  const key = `${epoch}:${zone}:${O ? 1 : 0}`;
  const rows = useMemo(
    () => (ranks ? ideaRows(key, () => rankAll(getDoc(), E, O, zone)) : []),
    // ranked once per deck: votes during the visit must not reshuffle it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ranks],
  );
  const occs = useMemo(() => rows.map((r) => r.i), [rows]);
  const byOcc = useMemo(() => new Map(rows.map((r) => [r.i, r])), [rows]);
  const same = st.deckKey === key;
  const skipped = useMemo(() => (same ? st.skip : []), [same, st.skip]);
  const hidden = useMemo(() => {
    const sk = new Set(skipped);
    return (o: number) => sk.has(o) || !!jobForOcc(d, o) || (voteOf(d, o)?.d ?? 0) < 0;
  }, [skipped, d]);
  const eff = deckIndex(occs, same ? st.idx : 0, hidden, st.rating);
  const n = ideaSlots(w);
  const cur = eff < rows.length ? rows[eff] : null;

  /* keep trying to fetch O*NET while the ideas are open; once it is in, the deck is dealt again */
  useEffect(() => {
    if (zones) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = () =>
      void loadOnet().then((o) => {
        if (alive && !o?.z) timer = setTimeout(attempt, 10500);
      });
    attempt();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [zones]);

  /* ---------- what the buttons, keys and swipes do ---------- */
  /* focus is not lost when the pressed button gives way to the next ones; after a shortcut pressed with
     nothing focused, focus stays where it was, so Space and Enter keep meaning "turn" and "next" */
  const deckRef = useRef<HTMLDivElement>(null);
  const focusAim = useRef<FocusAim>(null);
  const aimFocus = (aim: FocusAim) => {
    focusAim.current = deckRef.current?.contains(document.activeElement) ? aim : null;
  };
  const at = (patch: Partial<ReturnType<typeof useGoals.getState>>) =>
    useGoals.setState({ deckKey: key, idx: eff, skip: skipped, ...patch });

  const vote = (dir: 1 | -1, occ: number) => {
    commit(); // thumbs on another card's skills are their own undo step
    const prevVote = voteOf(getDoc(), occ);
    let jobId: string | null = null;
    update((dr) => {
      setVote(dr, occ, dir);
      if (dir > 0 && !jobForOcc(dr, occ))
        jobId = addJob(dr, { title: occLabel(E, occ), occ, role: "maybe" }).id;
    });
    at({ rating: occ, last: { occ, prevVote, jobId } });
    setFlip(cardKey(occ), false);
    aimFocus({ what: "next", occ });
    toast(t(dir > 0 ? "c_liked" : "c_hidden"));
  };
  const next = () => {
    commit(); // the skill thumbs of this card become one undo step
    at({ rating: null });
    aimFocus({ what: "yes" });
    if (n === 1) window.scrollTo(0, 0);
  };
  const skip = (occ: number) => {
    at({ skip: [...skipped, occ], rating: null });
    setFlip(cardKey(occ), false);
    aimFocus({ what: "yes" });
  };
  const undo = () => {
    const last = st.last;
    if (!last) return;
    update((dr) => {
      const v = dr.esco.votes;
      const i = v.findIndex((x) => x.o === last.occ);
      if (i >= 0) v.splice(i, 1);
      if (last.prevVote) v.push(structuredClone(last.prevVote));
      if (last.jobId) removeJob(dr, last.jobId);
    });
    at({ rating: null, last: null });
    aimFocus({ what: "yes" });
  };
  const setZone = (z: Zone | 0) => useGoals.setState({ zone: z, rating: null });

  useEffect(() => {
    const aim = focusAim.current;
    if (!aim) return;
    focusAim.current = null;
    const a = document.activeElement;
    if (a && a !== document.body && a.isConnected) return;
    const box = deckRef.current;
    const el =
      aim.what === "next"
        ? (box?.querySelector<HTMLElement>(`[data-slot="${aim.occ}"] [data-idea="next"]`) ??
          box?.querySelector<HTMLElement>('[data-idea="next"]'))
        : box?.querySelector<HTMLElement>('[data-idea="yes"]');
    focusForStep(el);
  });

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || isShortcutBlocked(e)) return;
    const el = e.target as HTMLElement;
    // Space and Enter keep their usual meaning on a focused control
    const onControl = !!el.closest?.("button,a,[role='button']");
    if (st.rating != null) {
      if (e.key === "ArrowRight" || (e.key === "Enter" && !onControl)) {
        e.preventDefault();
        next();
      }
      return;
    }
    if (!cur) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      vote(1, cur.i);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      vote(-1, cur.i);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      skip(cur.i);
    } else if (e.key === " " && !onControl) {
      e.preventDefault();
      toggleFlip(cardKey(cur.i));
    }
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  /* ---------- the screen ---------- */
  /* the filter sits under the title, so the way back, the count and the title keep one line each */
  const head = (
    <div className="flex flex-col gap-3">
      <div>
        <RunHeader
          onBack={() => go("goals")}
          backLabel={t("nav_goals")}
          eyebrow={t("nav_goals")}
          title={t("g_ideas_h")}
          count={cur ? t("c_count", { n: eff + 1, t: rows.length }) : undefined}
        />
      </div>
      {zones && (
        <Select
          aria-label={t("c_filter")}
          value={zone}
          onChange={(e) => setZone(+e.target.value as Zone | 0)}
          className="min-h-11 w-auto max-w-full self-start rounded-tile py-1.5 pr-9 pl-3 text-small font-bold"
        >
          <option value={0}>
            {t("c_filter")}: {t("c_any")}
          </option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {t(`z${z}`)}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
  const shell = (body: ReactNode) => (
    <Page width="wide">
      {head}
      {body}
    </Page>
  );

  /* without interests or rated skills there is nothing to rank yet: keep the header, so Back and the
     screen's title are there, and point to the part that unlocks ideas */
  if (!ranks)
    return shell(
      <EmptyState
        actions={
          <Button variant="primary" onClick={() => go("profile/int")}>
            {t("g_ideas_go")}
          </Button>
        }
      >
        {t("g_ideas_need")}
      </EmptyState>,
    );
  if (!rows.length && zone)
    return shell(
      <EmptyState
        size={72}
        title={t("c_zone_none_h")}
        actions={
          <Button variant="primary" onClick={() => setZone(0)}>
            {t("c_zone_all")}
          </Button>
        }
      >
        {t("c_zone_none_p")}
      </EmptyState>,
    );
  if (!cur)
    return shell(
      <EmptyState
        size={72}
        mood="yay"
        title={t("c_nomore_h")}
        actions={
          <>
            {skipped.length > 0 && (
              <Button onClick={() => useGoals.setState({ deckKey: key, skip: [], idx: 0, rating: null })}>
                {t("c_skipped", { n: skipped.length })}
              </Button>
            )}
            <Button variant="primary" onClick={() => go("goals")}>
              {t("g_title")}
            </Button>
          </>
        }
      >
        {t("c_nomore_p")}
      </EmptyState>,
    );

  const handlers = { vote, next, skip, undo };
  const live = (
    <p className="sr-only" aria-live="polite">
      {occLabel(E, cur.i)}
    </p>
  );
  if (n > 1) {
    const hand = dealHand(occs, eff, n, hidden, st.rating);
    return shell(
      <div
        ref={deckRef}
        className="grid items-stretch gap-[18px] pt-1.5"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {live}
        {hand.map((o) => (
          <Slot key={o} idea={byOcc.get(o)!} rating={st.rating === o} {...handlers} />
        ))}
      </div>,
    );
  }
  return shell(
    <div ref={deckRef} className="flex flex-col">
      {live}
      <Single key={cur.i} idea={cur} rating={st.rating === cur.i} {...handlers} />
    </div>,
  );
}

interface CardActions {
  idea: Idea;
  rating: boolean;
  vote: (dir: 1 | -1, occ: number) => void;
  next: () => void;
  skip: (occ: number) => void;
  undo: () => void;
}

/** Phones: one big card with a stack behind it, the buttons in a bar at the bottom. */
function Single({ idea, rating, vote, next, skip, undo }: CardActions) {
  const occ = idea.i;
  const swipe = usePointerSwipe(() => (rating ? next() : skip(occ)));
  return (
    <>
      <div className="relative pt-1.5" {...swipe}>
        <div className="deck-stack" aria-hidden="true">
          <i />
          <i />
        </div>
        <JobCard occ={occ} idea={idea} rate={rating} deal />
      </div>
      <ActionBar className="flex-wrap gap-y-1">
        <Buttons idea={idea} rating={rating} vote={vote} next={next} skip={skip} undo={undo} />
      </ActionBar>
    </>
  );
}

/** Tablets and computers: a card with its own bar, two or three side by side. */
function Slot({ idea, rating, vote, next, skip, undo }: CardActions) {
  const occ = idea.i;
  const swipe = usePointerSwipe(() => (rating ? next() : skip(occ)));
  return (
    <div className="flex min-w-0 flex-col" data-slot={occ} {...swipe}>
      <JobCard occ={occ} idea={idea} rate={rating} fill deal />
      <div className="flex flex-wrap gap-x-2 gap-y-1 pt-3 [&>*]:min-w-0 [&>*]:flex-1">
        <Buttons idea={idea} rating={rating} vote={vote} next={next} skip={skip} undo={undo} />
      </div>
    </div>
  );
}

function Buttons({ idea, rating, vote, next, skip, undo }: CardActions) {
  const t = useT(strings);
  const occ = idea.i;
  const flipped = useFlipped(cardKey(occ));
  const tall = "min-h-16 flex-col gap-0.5 px-1.5 text-small whitespace-normal [&_svg]:size-6";
  if (rating)
    return (
      <>
        <Button key="undo" data-idea="undo" onClick={undo}>
          <Icon name="back" />
          {t("undo")}
        </Button>
        <Button key="next" variant="primary" data-idea="next" onClick={next}>
          {t("c_next")}
          <Icon name="arrow" />
        </Button>
      </>
    );
  return (
    <>
      <Button key="no" variant="no" className={tall} data-idea="no" onClick={() => vote(-1, occ)}>
        <Icon name="up" flip />
        <span>{t("c_no")}</span>
      </Button>
      <Button key="flip" className={tall} data-idea="flip" onClick={() => toggleFlip(cardKey(occ))}>
        <Icon name="flip" />
        <span>{flipped ? t("c_front") : t("c_flip")}</span>
      </Button>
      <Button key="yes" variant="yes" className={tall} data-idea="yes" onClick={() => vote(1, occ)}>
        <Icon name="up" />
        <span>{t("c_yes")}</span>
      </Button>
      <LinkButton
        className="basis-full! justify-center self-center text-center text-small"
        data-idea="skip"
        onClick={() => skip(occ)}
      >
        {t("c_skip")}
      </LinkButton>
    </>
  );
}
