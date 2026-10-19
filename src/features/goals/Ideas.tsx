import { useEffect, useEffectEvent, useMemo, useRef, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Doc } from "@/data/types";
import { addJob, jobForOcc, removeJob } from "@/data/doc";
import { commit, getDoc, update, useDoc } from "@/data/store";
import { useCommitOnLeave } from "@/data/hooks";
import { isShortcutBlocked } from "@/lib/keys";
import { focusForStep } from "@/lib/focus";
import { cn } from "@/lib/cn";
import { useEscoReady, useOnet } from "@/app/catalog";
import { go } from "@/app/router";
import { toast, toastUndo } from "@/app/toast";
import { loadOnet, occLabel } from "@/domain/catalog";
import { type Idea, type Zone, canRank, rankAll, setVote, voteOf } from "@/domain/rank";
import { useT } from "@/i18n";
import { ActionBar, Button, EmptyState, Icon, Page, RunHeader, Select } from "@/ui";
import { JobCard, type IdeaMark } from "./JobCard";
import { DECK_SIZE, clampPos, dealHand, deckOrder, ideaSlots, markSeen, stepPos, unmarked } from "./layout";
import { cardKey, ideaRanking, setFlip, toggleFlip, useFlipped, useGoals, useViewportWidth } from "./store";
import { usePointerSwipe } from "./usePointerSwipe";
import { strings } from "./strings";

/* =================== JOB IDEAS: A DECK YOU BROWSE ===================
   Next and Back go through the ideas one card at a time, like photos: swipe a card to the left for the next
   one, to the right for the one before. Marking is done with the buttons only: "I like it" puts the job on
   the shortlist and turns the card over so single skills can be rated (optional); "Not for me" marks it and
   goes on (with Undo in the toast). Marked cards stay in the deck and show their mark, so going back to one
   lets you change your mind. The cards you have seen keep their order; the ones ahead are ranked again as you
   mark (see layout.ts). At the end: how many are still unmarked, and a way through just those.
   Phones get one big card on a stack; tablets and computers two or three side by side, moving by one card.
   Keys: ← back, → next, L I like it, N not for me, space turns the card; while rating, Enter goes on too. */

const ZONES = [1, 2, 3, 4] as const;
const NONE: number[] = [];
/** where focus goes when the control that had it gave way: the first of these selectors found in the deck */
type FocusAim = string[] | null;

/** How the person marked an idea, read from the document: a shortlist job (or goal), or a thumbs down. */
function ideaMark(d: Doc, occ: number): IdeaMark {
  const j = jobForOcc(d, occ);
  if (j?.role === "goal") return "goal";
  if (j?.role === "maybe") return "like";
  return (voteOf(d, occ)?.d ?? 0) < 0 ? "no" : null;
}

export function Ideas() {
  useCommitOnLeave();
  const t = useT(strings);
  const d = useDoc();
  const E = useEscoReady();
  const O = useOnet();
  const w = useViewportWidth();
  const st = useGoals(
    useShallow((s) => ({
      zone: s.zone,
      deckKey: s.deckKey,
      seen: s.seen,
      pos: s.pos,
      pass: s.pass,
      rankVer: s.rankVer,
      rating: s.rating,
      last: s.last,
    })),
  );
  const ranks = canRank(d);

  /* preparation levels come with the O*NET file: without it there is nothing to filter by */
  const zones = !!O?.z;
  const zone: Zone | 0 = zones ? st.zone : 0;
  /* the profile, not the epoch: the place in the deck is kept across reloads (another profile opening clears it
     anyway, see the store) */
  const key = `${d.example ?? "own"}:${zone}:${O ? 1 : 0}`;
  /* another deck (filter, profile, catalogue) starts from its first card */
  const same = st.deckKey === key;
  const seen = same ? st.seen : NONE;
  const pass = same ? st.pass : null;
  const ver = same ? st.rankVer : 0;
  const ranking = useMemo(
    () => (ranks ? ideaRanking(key, ver, () => rankAll(getDoc(), E, O, zone), seen, DECK_SIZE) : null),
    // ranked again only when marks changed (ver), not on every skill thumb
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ver, ranks],
  );
  const order = useMemo(() => (ranking ? deckOrder(seen, ranking.ranked) : NONE), [ranking, seen]);
  const view = pass ?? order;
  const pos = clampPos(same ? st.pos : 0, view.length);
  const n = ideaSlots(w);
  const hand = dealHand(view, pos, n);
  const cur = hand.length ? hand[0] : null;
  const ideaOf = (o: number): Idea | null => ranking?.rows.get(o) ?? null;
  const markOf = (o: number) => ideaMark(d, o);

  /* the cards on the table are seen: from now on they keep their place in the deck */
  useEffect(() => {
    const next = markSeen(seen, hand);
    if (next !== seen)
      useGoals.setState({
        deckKey: key,
        seen: [...next],
        pos,
        pass,
        rankVer: ver,
        ...(same ? {} : { rating: null }),
      });
  });

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
    useGoals.setState({ deckKey: key, seen: [...seen], pos, pass, rankVer: ver, ...patch });

  /** one card on or back; leaving a card being rated makes its skill thumbs one undo step */
  const step = (dir: 1 | -1) => {
    if (st.rating != null) commit();
    const to = stepPos(pos, dir, view.length);
    at({ pos: to, rating: null, rankVer: st.rating != null ? ver + 1 : ver });
    aimFocus(
      to >= view.length
        ? ['[data-end="go"]', '[data-end="goals"]']
        : dir < 0
          ? ['[data-nav="back"]:not([aria-disabled="true"])', '[data-nav="next"]']
          : ['[data-nav="next"]'],
    );
    if (n === 1 && to !== pos) window.scrollTo(0, 0);
  };
  const like = (occ: number) => {
    commit(); // thumbs on another card's skills are their own undo step
    const prevVote = voteOf(getDoc(), occ);
    let jobId: string | null = null;
    update((dr) => {
      setVote(dr, occ, 1);
      if (!jobForOcc(dr, occ)) jobId = addJob(dr, { title: occLabel(E, occ), occ, role: "maybe" }).id;
    });
    at({ rating: occ, last: { occ, prevVote, jobId }, rankVer: ver + 1 });
    setFlip(cardKey(occ), false);
    aimFocus(['[data-nav="next"]']);
    toast(t("c_liked"));
  };
  /* marks the card and goes on; Undo in the toast is the app's undo (also Ctrl+Z), so it takes back exactly
     this step */
  const notForMe = (occ: number) => {
    commit();
    update((dr) => void setVote(dr, occ, -1));
    const to = stepPos(pos, 1, view.length);
    at({ pos: to, rating: null, rankVer: ver + 1 });
    setFlip(cardKey(occ), false);
    aimFocus(
      to >= view.length
        ? ['[data-end="go"]', '[data-end="goals"]']
        : ['[data-idea="no"]', '[data-nav="next"]'],
    );
    if (n === 1) window.scrollTo(0, 0);
    toastUndo(t("c_no_t"));
  };
  const unmark = (occ: number) => {
    commit();
    update((dr) => void setVote(dr, occ, 0));
    at({ rankVer: ver + 1 });
    aimFocus([`[data-slot="${occ}"] [data-idea="no"]`, '[data-idea="no"]', '[data-nav="next"]']);
    toast(t("c_unmark_t"));
  };
  /* the reverse of "I like it" (a goal is changed on its own page, where its courses and ads are) */
  const takeOff = (occ: number) => {
    commit();
    update((dr) => {
      const j = jobForOcc(dr, occ);
      if (j?.role === "maybe") removeJob(dr, j.id);
      setVote(dr, occ, 0);
    });
    at({ rating: st.rating === occ ? null : st.rating, rankVer: ver + 1 });
    aimFocus([`[data-slot="${occ}"] [data-idea="yes"]`, '[data-idea="yes"]', '[data-nav="next"]']);
    toast(t("c_off_t"));
  };
  const rate = (occ: number) => {
    commit();
    at({ rating: occ });
    aimFocus([`[data-slot="${occ}"] [data-idea="done"]`, '[data-idea="done"]', '[data-nav="next"]']);
  };
  const done = () => {
    const occ = st.rating;
    commit(); // the skill thumbs of this card become one undo step
    at({ rating: null, rankVer: ver + 1 });
    aimFocus([`[data-slot="${occ}"] [data-idea="rate"]`, '[data-idea="rate"]', '[data-nav="next"]']);
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
    at({ rating: null, last: null, rankVer: ver + 1 });
    aimFocus([`[data-slot="${last.occ}"] [data-idea="yes"]`, '[data-idea="yes"]', '[data-nav="next"]']);
  };
  const startPass = () => {
    at({ pass: unmarked(order, (o) => markOf(o) !== null), pos: 0, rating: null });
    aimFocus(['[data-nav="next"]']);
  };
  const setZone = (z: Zone | 0) => useGoals.setState({ zone: z, rating: null });

  useEffect(() => {
    const aim = focusAim.current;
    if (!aim) return;
    focusAim.current = null;
    const a = document.activeElement;
    if (a && a !== document.body && a.isConnected) return;
    const box = deckRef.current;
    for (const sel of aim) {
      const el = box?.querySelector<HTMLElement>(sel);
      if (el) return focusForStep(el);
    }
  });

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || isShortcutBlocked(e)) return;
    const el = e.target as HTMLElement;
    // Space and Enter keep their usual meaning on a focused control
    const onControl = !!el.closest?.("button,a,[role='button'],select");
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "ArrowLeft" || k === "ArrowRight") {
      if (!view.length) return;
      e.preventDefault();
      step(k === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (st.rating != null) {
      if (k === "Enter" && !onControl) {
        e.preventDefault();
        step(1);
      }
      return;
    }
    if (cur == null) return;
    const mark = markOf(cur);
    if (k === "l" && (mark === null || mark === "no")) {
      e.preventDefault();
      like(cur);
    } else if (k === "n" && mark === null) {
      e.preventDefault();
      notForMe(cur);
    } else if (k === " " && !onControl) {
      e.preventDefault();
      toggleFlip(cardKey(cur));
    }
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  /* ---------- the screen ---------- */
  const atEnd = view.length > 0 && cur == null;
  const left = useMemo(() => unmarked(order, (o) => ideaMark(d, o) !== null), [order, d]);
  /* said politely when the position changes: where you are and which job, or that the deck is through */
  const said =
    cur != null
      ? t("c_pos", { n: pos + 1, t: view.length, x: occLabel(E, cur) })
      : atEnd
        ? t("c_end_h", { n: order.length })
        : "";
  /* the filter sits under the title, so the way back, the count and the title keep one line each */
  const head = (
    <div className="flex flex-col gap-3">
      <div>
        <RunHeader
          onBack={() => go("goals")}
          backLabel={t("nav_goals")}
          eyebrow={t("nav_goals")}
          title={t("g_ideas_h")}
          count={
            cur != null ? t(pass ? "c_count_pass" : "c_count", { n: pos + 1, t: view.length }) : undefined
          }
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
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
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
  if (!order.length && zone)
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
  if (!order.length)
    return shell(
      <EmptyState
        size={72}
        state="arrived"
        title={t("c_nomore_h")}
        actions={
          <Button variant="primary" onClick={() => go("goals")}>
            {t("g_title")}
          </Button>
        }
      >
        {t("c_nomore_p")}
      </EmptyState>,
    );

  const nav = (
    <Nav
      first={pos === 0}
      rating={st.rating != null}
      onBack={() => step(-1)}
      onNext={() => step(1)}
      className={n === 1 ? "flex basis-full!" : undefined}
    />
  );
  if (cur == null)
    return shell(
      <div ref={deckRef}>
        <EmptyState
          size={72}
          state="arrived"
          title={t("c_end_h", { n: order.length })}
          actions={
            <>
              {left.length > 0 && (
                <Button variant="primary" data-end="go" onClick={startPass}>
                  {left.length === 1 ? t("c_end_go1") : t("c_end_go", { m: left.length })}
                </Button>
              )}
              <Button variant={left.length ? "soft" : "primary"} data-end="goals" onClick={() => go("goals")}>
                {t("g_title")}
              </Button>
              <Button data-end="back" aria-keyshortcuts="ArrowLeft" onClick={() => step(-1)}>
                <Icon name="back" />
                {t("c_back")}
              </Button>
            </>
          }
        >
          <p>
            {left.length === 0
              ? t("c_end_none")
              : left.length === 1
                ? t("c_end_open1")
                : t("c_end_open", { m: left.length })}
          </p>
          <p className="mt-1">{t("c_end_more")}</p>
        </EmptyState>
      </div>,
    );

  const handlers: CardActions = {
    like,
    notForMe,
    unmark,
    takeOff,
    rate,
    done,
    undo,
    step,
    canBack: pos > 0,
  };
  if (n > 1)
    return shell(
      <div ref={deckRef} className="flex flex-col">
        <div
          className="grid items-stretch gap-[18px] pt-1.5"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {hand.map((o) => (
            <Slot
              key={o}
              occ={o}
              idea={ideaOf(o)}
              mark={markOf(o)}
              rating={st.rating === o}
              canUndo={st.last?.occ === o}
              {...handlers}
            />
          ))}
        </div>
        <ActionBar>{nav}</ActionBar>
      </div>,
    );
  return shell(
    <div ref={deckRef} className="flex flex-col">
      <Single
        key={cur}
        occ={cur}
        idea={ideaOf(cur)}
        mark={markOf(cur)}
        rating={st.rating === cur}
        canUndo={st.last?.occ === cur}
        nav={nav}
        {...handlers}
      />
    </div>,
  );
}

interface CardActions {
  like: (occ: number) => void;
  notForMe: (occ: number) => void;
  unmark: (occ: number) => void;
  takeOff: (occ: number) => void;
  rate: (occ: number) => void;
  done: () => void;
  undo: () => void;
  step: (dir: 1 | -1) => void;
  canBack: boolean;
}
interface CardProps extends CardActions {
  occ: number;
  idea: Idea | null;
  mark: IdeaMark;
  rating: boolean;
  /** the like on this card can be taken back (it was the last one) */
  canUndo: boolean;
}

/* a swipe to the left brings the next card, to the right the one before (not past the first card) */
const useDeckSwipe = (step: (dir: 1 | -1) => void, canBack: boolean) =>
  usePointerSwipe(
    (dir) => step(dir < 0 ? 1 : -1),
    (dir) => dir < 0 || canBack,
  );

/** Phones: one big card with a stack behind it; the marks and Back / Next in a bar at the bottom. */
function Single(p: CardProps & { nav: ReactNode }) {
  const swipe = useDeckSwipe(p.step, p.canBack);
  return (
    <>
      <div className="relative pt-1.5" {...swipe}>
        <div className="deck-stack" aria-hidden="true">
          <i />
          <i />
        </div>
        <JobCard occ={p.occ} idea={p.idea} rate={p.rating} mark={p.mark} deal />
      </div>
      <ActionBar className="flex-wrap gap-y-2">
        <Buttons {...p} />
        {p.nav}
      </ActionBar>
    </>
  );
}

/** Tablets and computers: a card with its own buttons, two or three side by side; Back / Next under them. */
function Slot(p: CardProps) {
  const swipe = useDeckSwipe(p.step, p.canBack);
  return (
    <div className="flex min-w-0 flex-col" data-slot={p.occ} {...swipe}>
      <JobCard occ={p.occ} idea={p.idea} rate={p.rating} mark={p.mark} fill deal />
      <div className="flex flex-wrap gap-x-2 gap-y-1 pt-3 [&>*]:min-w-0 [&>*]:flex-1">
        <Buttons {...p} />
      </div>
    </div>
  );
}

/** Back and Next: the same as a swipe to the right or to the left. Back stays focusable on the first card
 *  (aria-disabled), so focus is not lost when it gets there. */
function Nav({
  first,
  rating,
  onBack,
  onNext,
  className,
}: {
  first: boolean;
  rating: boolean;
  onBack: () => void;
  onNext: () => void;
  className?: string;
}) {
  const t = useT(strings);
  return (
    <div className={cn("flex gap-2.5 [&>*]:min-w-0 [&>*]:flex-1 md:[&>*]:min-w-[150px]", className)}>
      <Button
        data-nav="back"
        aria-keyshortcuts="ArrowLeft"
        aria-disabled={first || undefined}
        className="min-h-11 aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:active:scale-100"
        onClick={() => !first && onBack()}
      >
        <Icon name="back" />
        {t("c_back")}
      </Button>
      <Button
        data-nav="next"
        variant={rating ? "primary" : "soft"}
        aria-keyshortcuts="ArrowRight"
        className="min-h-11"
        onClick={onNext}
      >
        {t("c_next")}
        <Icon name="arrow" />
      </Button>
    </div>
  );
}

/** The marks of a card, by what it is marked now. */
function Buttons({
  occ,
  mark,
  rating,
  canUndo,
  like,
  notForMe,
  unmark,
  takeOff,
  rate,
  done,
  undo,
}: CardProps) {
  const t = useT(strings);
  const flipped = useFlipped(cardKey(occ));
  const tall = "min-h-16 flex-col gap-0.5 px-1.5 text-small whitespace-normal [&_svg]:size-6";
  if (rating)
    return canUndo ? (
      <Button key="undo" data-idea="undo" className="min-h-11" onClick={undo}>
        <Icon name="back" />
        {t("undo")}
      </Button>
    ) : (
      <Button key="done" data-idea="done" className="min-h-11" onClick={done}>
        <Icon name="check" />
        {t("c_done")}
      </Button>
    );
  const flip = (
    <Button
      key="flip"
      className={tall}
      data-idea="flip"
      aria-keyshortcuts="Space"
      onClick={() => toggleFlip(cardKey(occ))}
    >
      <Icon name="flip" />
      <span>{flipped ? t("c_front") : t("c_flip")}</span>
    </Button>
  );
  if (mark === "like" || mark === "goal")
    return (
      <>
        {mark === "like" && (
          <Button key="off" className={tall} data-idea="off" onClick={() => takeOff(occ)}>
            <Icon name="close" />
            <span>{t("c_off")}</span>
          </Button>
        )}
        {flip}
        <Button key="rate" variant="yes" className={tall} data-idea="rate" onClick={() => rate(occ)}>
          <Icon name="up" />
          <span>{t("c_rate")}</span>
        </Button>
      </>
    );
  if (mark === "no")
    return (
      <>
        <Button key="unmark" className={tall} data-idea="unmark" onClick={() => unmark(occ)}>
          <Icon name="reset" />
          <span>{t("c_unmark")}</span>
        </Button>
        {flip}
        <Button
          key="yes"
          variant="yes"
          className={tall}
          data-idea="yes"
          aria-keyshortcuts="L"
          onClick={() => like(occ)}
        >
          <Icon name="up" />
          <span>{t("c_yes_after")}</span>
        </Button>
      </>
    );
  return (
    <>
      <Button
        key="no"
        variant="no"
        className={tall}
        data-idea="no"
        aria-keyshortcuts="N"
        onClick={() => notForMe(occ)}
      >
        <Icon name="up" flip />
        <span>{t("c_no")}</span>
      </Button>
      {flip}
      <Button
        key="yes"
        variant="yes"
        className={tall}
        data-idea="yes"
        aria-keyshortcuts="L"
        onClick={() => like(occ)}
      >
        <Icon name="up" />
        <span>{t("c_yes")}</span>
      </Button>
    </>
  );
}
