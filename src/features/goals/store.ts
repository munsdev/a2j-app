import { useSyncExternalStore } from "react";
import { create } from "zustand";
import type { Vote } from "@/data/types";
import type { Idea, Zone } from "@/domain/rank";
import { useProfileEpoch } from "@/app/samples";
import { bandWidth, widthBand } from "./layout";

/* =================== PER-VISIT STATE OF THE GOALS SCREENS ===================
   Which cards are turned over, where the idea deck stands, what is being compared. Nothing here is saved;
   it all goes when another profile opens (a sample or a backup replaced the data). */

export interface LastIdea {
  occ: number;
  /** the vote before, to put back on Undo */
  prevVote: Vote | null;
  /** the shortlist job the vote added */
  jobId: string | null;
}
interface GoalsState {
  /** card keys shown on their back */
  flipped: Record<string, true>;
  /** preparation level filter, 0 = any */
  zone: Zone | 0;
  /** the deck the position and history belong to (filter, profile, catalogue); another one starts afresh */
  deckKey: string;
  /** the ideas seen so far, in the order they were first seen: Back walks this list */
  seen: number[];
  /** the position in the deck (or in `pass`); the deck's length means "seen them all" */
  pos: number;
  /** going through the ideas left unmarked: those cards, in deck order; null = the whole deck */
  pass: number[] | null;
  /** bumped when marks change, so the cards still ahead are ranked again */
  rankVer: number;
  /** occupation whose card is in rating mode */
  rating: number | null;
  last: LastIdea | null;
  /** compared job ids, null = not chosen yet (the first three) */
  cmp: string[] | null;
  cmpAll: boolean;
}
const initial = (): GoalsState => ({
  flipped: {},
  zone: 0,
  deckKey: "",
  seen: [],
  pos: 0,
  pass: null,
  rankVer: 0,
  rating: null,
  last: null,
  cmp: null,
  cmpAll: false,
});
export const useGoals = create<GoalsState>(initial);

/* the ranked ideas of a deck. Ranked again only when marks changed (rankAll walks every occupation). The
   ranking row of a card is kept from the first time it was ranked while it is on screen or behind you, so a
   card you go back to says what it said before. */
let ideaCache: { key: string; ver: number; ranked: number[]; rows: Map<number, Idea> } | null = null;
/** The ranked occupations for a deck key and rank version, best first (at most `max`). */
export function ideaRanking(
  key: string,
  ver: number,
  rank: () => Idea[],
  keep: readonly number[],
  max: number,
) {
  if (ideaCache?.key !== key || ideaCache.ver !== ver) {
    const rows = ideaCache?.key === key ? ideaCache.rows : new Map<number, Idea>();
    const fresh = rank().slice(0, max);
    const stay = new Set(keep);
    fresh.forEach((r) => {
      if (!stay.has(r.i) || !rows.has(r.i)) rows.set(r.i, r);
    });
    ideaCache = { key, ver, ranked: fresh.map((r) => r.i), rows };
  }
  return ideaCache;
}

useProfileEpoch.subscribe(() => {
  ideaCache = null;
  useGoals.setState(initial());
});

/* ---------- flips ---------- */
export const cardKey = (occ: number, jobId?: string | null): string => jobId || "o" + occ;
export const useFlipped = (key: string): boolean => useGoals((s) => !!s.flipped[key]);
export function setFlip(key: string, on: boolean): void {
  useGoals.setState((s) => {
    const flipped = { ...s.flipped };
    if (on) flipped[key] = true;
    else delete flipped[key];
    return { flipped };
  });
}
export const toggleFlip = (key: string): void => setFlip(key, !useGoals.getState().flipped[key]);

/* ---------- the viewport width band (layouts change at 560 / 760 / 900 / 1000 / 1180px) ---------- */
function subscribeWidth(cb: () => void) {
  let raf = 0;
  const on = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(cb);
  };
  window.addEventListener("resize", on);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", on);
  };
}
/** A width standing for the current band: re-renders only when a breakpoint is crossed. */
export function useViewportWidth(): number {
  const band = useSyncExternalStore(
    subscribeWidth,
    () => widthBand(window.innerWidth),
    () => 0,
  );
  return bandWidth(band);
}
