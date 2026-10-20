import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
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
import { toastUndo } from "@/app/toast";
import { loadOnet, occLabel } from "@/domain/catalog";
import { type DeckFilter, type Idea, READY, canRank, rankAll, setVote, voteOf } from "@/domain/rank";
import { useT } from "@/i18n";
import { closeSheet, openSheet } from "@/app/sheet";
import { Button, EmptyState, Icon, LinkButton, Page, RunHeader, Select } from "@/ui";
import { IdeaDetails, JobCard, type IdeaMark } from "./JobCard";
import { DECK_SIZE, clampPos, dealHand, deckOrder, markSeen, stepPos, unmarked } from "./layout";
import { ideaRanking, useGoals } from "./store";
import { useDeckFling, type Fling } from "./usePointerSwipe";
import { strings } from "./strings";

/* =================== JOB IDEAS: A DECK YOU BROWSE ===================
   One card at a time, fitting the screen: the job, its score in a line, its first skills, and "All skills and
   details" for the rest (a sheet, so a long list never moves the deck). Under it the two big answers, 👎 Not
   for me and 👍 I like it, then Skip, then a small Back. Swipe the card right for I like it, left for Not for
   me, up to skip; the buttons and keys throw the card the same way. An answer marks the card and the next one
   comes; going back shows the mark: the filled thumb again takes it away, the other one switches it. Marks
   are steps of the app's undo (the toast, Ctrl+Z). The cards you have seen keep their order; the ones ahead
   are ranked again as you mark (see layout.ts). At the end: how many are still unmarked, and a way through
   just those.
   Keys: → I like it, ← Not for me, ↑ skip, Backspace back (L and N also mark). */

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
  const st = useGoals(
    useShallow((s) => ({
      zone: s.zone,
      deckKey: s.deckKey,
      seen: s.seen,
      pos: s.pos,
      pass: s.pass,
      rankVer: s.rankVer,
    })),
  );
  const ranks = canRank(d);

  /* preparation levels come with the O*NET file: without it there is nothing to filter by */
  const zones = !!O?.z;
  const zone: DeckFilter = zones ? st.zone : 0;
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
  /* one card on the table at a time, on every screen */
  const hand = dealHand(view, pos, 1);
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

  const deckRef = useRef<HTMLDivElement>(null);
  const deckRefFor = deckRef;
  /* the card gets the screen above the answers, so they are always in view without scrolling */
  const controlsRef = useRef<HTMLDivElement>(null);
  const deckMax = useDeckMax(deckRefFor, controlsRef);

  /* ---------- what the buttons, keys and swipes do ---------- */
  /* focus is not lost when the pressed button gives way to the next ones; after a shortcut pressed with
     nothing focused, focus stays where it was, so Space and Enter keep meaning "turn" and "next" */

  const focusAim = useRef<FocusAim>(null);
  const aimFocus = (aim: FocusAim) => {
    focusAim.current = deckRef.current?.contains(document.activeElement) ? aim : null;
  };
  const at = (patch: Partial<ReturnType<typeof useGoals.getState>>) =>
    useGoals.setState({ deckKey: key, seen: [...seen], pos, pass, rankVer: ver, ...patch });

  /** one card on or back; the card is replaced in place, the page does not move */
  const step = (dir: 1 | -1) => {
    const to = stepPos(pos, dir, view.length);
    at({ pos: to });
    aimFocus(
      to >= view.length
        ? ['[data-end="go"]', '[data-end="goals"]']
        : dir < 0
          ? ['[data-nav="back"]:not([aria-disabled="true"])', '[data-idea="yes"]']
          : ['[data-idea="yes"]'],
    );
  };
  /** mark a card and go on to the next, in one step (the deck moves and is ranked again together) */
  const mark = (occ: number, dir: 1 | -1) => {
    commit();
    update((dr) => {
      const j = jobForOcc(dr, occ);
      if (dir > 0 && !j) addJob(dr, { title: occLabel(E, occ), occ, role: "maybe" });
      /* from "I like it" to "Not for me": off the shortlist too (a goal is changed on its own page) */
      if (dir < 0 && j?.role === "maybe") removeJob(dr, j.id);
      setVote(dr, occ, dir);
    });
    at({ rankVer: ver + 1, pos: stepPos(pos, 1, view.length) });
    aimFocus(['[data-idea="yes"]', '[data-end="go"]', '[data-end="goals"]']);
    toastUndo(t(dir > 0 ? "c_liked" : "c_no_t"));
  };
  /** the filled thumb again: no mark (and off the shortlist); the card stays */
  const unmark = (occ: number) => {
    commit();
    update((dr) => {
      const j = jobForOcc(dr, occ);
      if (j?.role === "maybe") removeJob(dr, j.id);
      setVote(dr, occ, 0);
    });
    at({ rankVer: ver + 1 });
    toastUndo(t("c_unmark_t"));
  };
  /** the card was thrown (a swipe, a button, a key): right I like it, left Not for me, up skip. A card already
   *  marked that way, or a goal, just goes on. */
  const thrown = (dir: Fling) => {
    if (cur == null) return;
    const m = markOf(cur);
    if (dir === "up" || m === "goal" || (dir === "right" && m === "like") || (dir === "left" && m === "no"))
      step(1);
    else mark(cur, dir === "right" ? 1 : -1);
  };
  const { fling, handlers: swipe } = useDeckFling(thrown);
  /** a thumb button: the filled one again takes the mark away, otherwise the card is thrown that way */
  const thumb = (dir: 1 | -1) => {
    if (cur == null) return;
    const m = markOf(cur);
    if (m === "goal") return;
    if ((dir > 0 && m === "like") || (dir < 0 && m === "no")) unmark(cur);
    else fling(dir > 0 ? "right" : "left");
  };
  const openDetails = (occ: number) =>
    openSheet(
      <DetailsSheet
        occ={occ}
        idea={ideaOf(occ)}
        onMore={() => openDetails(occ)}
        onThumb={(dir) => {
          closeSheet();
          /* once the sheet is gone, the card goes the way of the answer */
          setTimeout(() => thumb(dir), 60);
        }}
      />,
      { label: occLabel(E, occ) },
    );
  const startPass = () => {
    at({ pass: unmarked(order, (o) => markOf(o) !== null), pos: 0 });
    aimFocus(['[data-nav="next"]']);
  };
  const setZone = (z: DeckFilter) => useGoals.setState({ zone: z });

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
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Backspace") {
      if (!view.length || pos === 0) return;
      e.preventDefault();
      step(-1);
      return;
    }
    if (cur == null) return;
    if (k === "ArrowRight" || k === "l") {
      e.preventDefault();
      thumb(1);
    } else if (k === "ArrowLeft" || k === "n") {
      e.preventDefault();
      thumb(-1);
    } else if (k === "ArrowUp") {
      e.preventDefault();
      fling("up");
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
  /* one slim line: the way back, "Job ideas", the count and the filter, so the card gets the screen */
  const filter = zones && (
    <Select
      aria-label={t("c_filter")}
      value={zone}
      onChange={(e) => setZone(+e.target.value as DeckFilter)}
      className="min-h-9 w-auto max-w-[34vw] truncate rounded-tile py-1 pr-7 pl-2 text-caption font-bold sm:max-w-none"
    >
      <option value={0}>{t("c_all_levels")}</option>
      <option value={READY}>{t("c_ready")}</option>
      {ZONES.map((z) => (
        <option key={z} value={z}>
          {t(`z${z}`)}
        </option>
      ))}
    </Select>
  );
  const head = (
    <div>
      <RunHeader
        onBack={() => go("goals")}
        backLabel={t("nav_goals")}
        eyebrow={t("g_ideas_h")}
        count={cur != null ? t(pass ? "c_count_pass" : "c_count", { n: pos + 1, t: view.length }) : undefined}
        end={filter || undefined}
      />
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
  /* one card at a time, in a reading-width column on every screen */
  const shell = (body: ReactNode) => (
    <Page>
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
        title={t(zone === READY ? "c_ready_none_h" : "c_zone_none_h")}
        actions={
          <Button variant="primary" onClick={() => setZone(0)}>
            {t("c_zone_all")}
          </Button>
        }
      >
        {t(zone === READY ? "c_ready_none_p" : "c_zone_none_p")}
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
              <Button data-end="back" aria-keyshortcuts="Backspace" onClick={() => step(-1)}>
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

  const m = markOf(cur);
  return shell(
    <div ref={deckRef} className="flex flex-col gap-3">
      <div className="deck relative pt-1.5" style={{ ["--deck-max" as string]: `${deckMax}px` }} {...swipe}>
        <div className="deck-stack" aria-hidden="true">
          <i />
          <i />
        </div>
        <JobCard key={cur} occ={cur} idea={ideaOf(cur)} mark={m} flat deal onMore={() => openDetails(cur)} />
        {/* the rest of the card is in the details sheet: the way there sits on the card's lower edge */}
        <button type="button" className="deck-more" onClick={() => openDetails(cur)}>
          {t("c_details_short")}
          <Icon name="chev" className="size-4" />
        </button>
        {/* what a drag will do, shown as it passes the threshold */}
        <span className="deck-hint" data-for="right" aria-hidden="true">
          {t("c_yes")}
        </span>
        <span className="deck-hint" data-for="left" aria-hidden="true">
          {t("c_no")}
        </span>
        <span className="deck-hint" data-for="up" aria-hidden="true">
          {t("c_skip")}
        </span>
      </div>
      <div ref={controlsRef} className="flex flex-col gap-3">
        <Thumbs mark={m} onThumb={thumb} />
        <Button
          wide
          data-nav="next"
          aria-keyshortcuts="ArrowUp"
          className="min-h-12"
          variant={m ? "primary" : "soft"}
          onClick={() => fling("up")}
        >
          {t(m ? "c_next" : "c_skip")}
          <Icon name="arrow" className={m ? undefined : "-rotate-90"} />
        </Button>
        <LinkButton
          data-nav="back"
          aria-keyshortcuts="Backspace"
          aria-disabled={pos === 0 || undefined}
          className="min-h-11 gap-1.5 self-center text-small aria-disabled:cursor-default aria-disabled:opacity-45"
          onClick={() => pos > 0 && step(-1)}
        >
          <Icon name="back" className="size-4" />
          {t("c_back")}
        </LinkButton>
      </div>
    </div>,
  );
}

/** The two answers, big and side by side: 👎 Not for me (red), 👍 I like it (green). The mark fills its
 *  thumb (aria-pressed); a job that is one of the goals shows "On your goals" and is changed on its own page. */
function Thumbs({ mark, onThumb }: { mark: IdeaMark; onThumb: (dir: 1 | -1) => void }) {
  const t = useT(strings);
  const big = "min-h-16 gap-2.5 text-lead whitespace-normal [&_svg]:size-6";
  const goal = mark === "goal";
  const up = mark === "like" || goal;
  const down = mark === "no";
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant={down ? "danger" : "no"}
        className={cn(big, !down && "shadow-[inset_0_0_0_2px_var(--no)]")}
        data-idea="no"
        aria-pressed={down}
        aria-disabled={goal || undefined}
        aria-keyshortcuts="ArrowLeft"
        onClick={() => onThumb(-1)}
      >
        <Icon name="up" flip />
        <span>{t("c_no")}</span>
      </Button>
      <Button
        variant="yes"
        className={cn(big, !up && "bg-yes-bg text-yes shadow-[inset_0_0_0_2px_var(--yes)]")}
        data-idea="yes"
        aria-pressed={up}
        aria-disabled={goal || undefined}
        aria-keyshortcuts="ArrowRight"
        onClick={() => onThumb(1)}
      >
        <Icon name="up" />
        <span>{goal ? t("c_goal_on") : t("c_yes")}</span>
      </Button>
    </div>
  );
}

/** "All skills and details": everything the deck card leaves out, in a sheet that scrolls on its own; the two
 *  answers stay at its foot. */
function DetailsSheet({
  occ,
  idea,
  onMore,
  onThumb,
}: {
  occ: number;
  idea: Idea | null;
  onMore: () => void;
  onThumb: (dir: 1 | -1) => void;
}) {
  const mark = useDoc((d) => ideaMark(d, occ));
  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-5 -mt-5">
        <IdeaDetails occ={occ} idea={idea} mark={mark} onMore={onMore} />
      </div>
      <div className="sticky -bottom-6 z-[1] -mx-4 border-t border-line bg-surface px-4 py-3 sm:-bottom-[26px] sm:-mx-5 sm:px-5">
        <Thumbs mark={mark} onThumb={onThumb} />
      </div>
    </div>
  );
}

/** The tallest the card may be: the window, less what is above the deck and the answers under it (at least
 *  260px; on a very small screen the page scrolls). Measured again when the window or the answers change. */
function useDeckMax(deck: RefObject<HTMLElement | null>, controls: RefObject<HTMLElement | null>): number {
  const [h, setH] = useState(520);
  useLayoutEffect(() => {
    const measure = () => {
      const top = (deck.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
      const below = controls.current?.offsetHeight ?? 0;
      setH(Math.max(260, Math.round(window.innerHeight - top - below - 36)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (controls.current) ro.observe(controls.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  });
  return h;
}
