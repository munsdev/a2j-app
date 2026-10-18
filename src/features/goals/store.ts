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
  /** the deck this position belongs to (see deckKey) */
  deckKey: string;
  idx: number;
  /** ideas passed over without a thumb; they come back when the deck is dealt again */
  skip: number[];
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
  idx: 0,
  skip: [],
  rating: null,
  last: null,
  cmp: null,
  cmpAll: false,
});
export const useGoals = create<GoalsState>(initial);

/* the ranked ideas: a stable list for the visit, so voting does not reshuffle the deck */
let ideaCache: { key: string; rows: Idea[] } | null = null;
/** The idea list for a deck key, ranked once (rankAll walks every occupation). */
export function ideaRows(key: string, rank: () => Idea[]): Idea[] {
  if (ideaCache?.key !== key) ideaCache = { key, rows: rank().slice(0, 60) };
  return ideaCache.rows;
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
