import { create } from "zustand";
import type { Idea } from "@/domain/rank";
import { isLens, type Lens } from "@/domain/lenses";
import { useProfileEpoch } from "@/app/samples";
import { storage } from "@/lib/storage";

/* =================== PER-VISIT STATE OF THE GOALS SCREENS ===================
   Which cards are turned over, where the idea deck stands, what is being compared. Only the place in the idea
   deck (and its filter) is saved, in a2j:deck, so a reload goes on where you were; everything goes when
   another profile opens (a sample or a backup replaced the data). */

interface GoalsState {
  /** card keys shown on their back */
  flipped: Record<string, true>;
  /** how the deck is dealt: for you, ready now, a preparation level, or an explore option (lenses.ts) */
  zone: Lens;
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
  /** compared job ids, null = not chosen yet (the first three) */
  cmp: string[] | null;
  cmpAll: boolean;
}
const initial = (): GoalsState => ({
  flipped: {},
  zone: "all",
  deckKey: "",
  seen: [],
  pos: 0,
  pass: null,
  rankVer: 0,
  cmp: null,
  cmpAll: false,
});
const DECK_STORE = "a2j:deck";
type SavedDeck = Pick<GoalsState, "zone" | "deckKey" | "seen" | "pos" | "pass">;
const deckOf = (s: GoalsState): SavedDeck => ({
  zone: s.zone,
  deckKey: s.deckKey,
  seen: s.seen,
  pos: s.pos,
  pass: s.pass,
});
function savedDeck(): Partial<SavedDeck> {
  try {
    const v = JSON.parse(storage.get(DECK_STORE) ?? "null") as SavedDeck | null;
    const nums = (a: unknown) => Array.isArray(a) && a.every((n) => Number.isInteger(n));
    if (!v || typeof v.deckKey !== "string" || !nums(v.seen) || !Number.isInteger(v.pos)) return {};
    return {
      zone: isLens(v.zone) ? v.zone : "all",
      deckKey: v.deckKey,
      seen: v.seen,
      pos: v.pos,
      pass: v.pass === null || nums(v.pass) ? v.pass : null,
    };
  } catch {
    return {};
  }
}
export const useGoals = create<GoalsState>(() => ({ ...initial(), ...savedDeck() }));
let lastSaved = JSON.stringify(deckOf(useGoals.getState()));
useGoals.subscribe((s) => {
  const v = JSON.stringify(deckOf(s));
  if (v === lastSaved) return;
  lastSaved = v;
  if (s.deckKey) storage.set(DECK_STORE, v);
  else storage.remove(DECK_STORE);
});

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
