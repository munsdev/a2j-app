import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSheetStore, closeSheetSilently } from "./sheet";

/* =================== ROUTES ===================
   Hash routes, so the app works as static files anywhere and old links keep working:
   #home · #profile · #profile/<part> · #goals · #goals/ideas · #goals/job/<id> · #goals/compare · #plan
   #edit/<tab> · #backup. Every screen change is a history step, so browser and Android Back return to the
   previous screen; Back closes an open sheet first. A screen of steps (a part of the profile) takes Back for
   itself with useStepBack, so a phone's back gesture (easily set off while swiping cards near the edge of the
   screen) goes back one step instead of leaving the part. */

export const VIEWS = ["home", "profile", "goals", "plan", "edit", "backup"] as const;
export type View = (typeof VIEWS)[number];
export interface Route {
  view: View;
  /** the parts after the view: #goals/job/j3 → ["job", "j3"] */
  params: string[];
  /** the hash without # */
  path: string;
  /** the hash named a screen that does not exist */
  unknown: boolean;
}

function parse(hash: string): Route {
  const path = hash.replace(/^#/, "");
  const parts = path.split("/").filter(Boolean);
  const known = (VIEWS as readonly string[]).includes(parts[0]);
  return {
    view: known ? (parts[0] as View) : "home",
    params: known ? parts.slice(1) : [],
    path,
    unknown: !!parts[0] && !known,
  };
}

let current = parse(typeof location !== "undefined" ? location.hash : "");
const listeners = new Set<() => void>();
function emit() {
  const next = parse(location.hash);
  if (next.path === current.path) return;
  current = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The current route. Re-renders on every screen change. */
export const useRoute = (): Route => useSyncExternalStore(subscribe, () => current);
export const getRoute = (): Route => current;

/* the screen of steps on now: one extra history entry ({ step: true }) on top of its own, popped by Back */
let stepBack: (() => void) | null = null;
const onStepEntry = () => (history.state as { step?: boolean } | null)?.step === true;
function pushStepEntry() {
  try {
    history.pushState({ step: true }, "", location.href);
  } catch {
    /* no history: Back simply leaves */
  }
}

/** Take Back for this screen: Back calls onBack (one step back, or leave the screen with go()). */
export function useStepBack(onBack: () => void): void {
  const cb = useRef(onBack);
  useEffect(() => {
    cb.current = onBack;
  });
  useEffect(() => {
    if (!onStepEntry()) pushStepEntry();
    stepBack = () => cb.current();
    return () => {
      stepBack = null;
    };
  }, []);
}

/** Go to a screen: go("goals/job/j3"). replace=true changes the current history entry instead of adding one. */
export function go(path: string, opts: { replace?: boolean } = {}): void {
  const h = "#" + path;
  const sheetOpen = useSheetStore.getState().open;
  if (sheetOpen) closeSheetSilently();
  if (location.hash !== h) {
    try {
      // an open sheet has its own history entry: take it over, so Back goes where the person expects
      // the same for the extra entry of a screen of steps, so leaving it leaves no dead entry behind
      if (opts.replace || sheetOpen || onStepEntry()) history.replaceState(null, "", h);
      else history.pushState(null, "", h);
    } catch {
      location.hash = h;
    }
  }
  emit();
  window.scrollTo(0, 0);
}

/** Wire the browser: Back closes a sheet first, otherwise shows the previous screen. Call once at start. */
export function initRouter(): void {
  if (!location.hash) history.replaceState(null, "", "#home");
  current = parse(location.hash);
  window.addEventListener("popstate", () => {
    if (useSheetStore.getState().open) {
      closeSheetSilently();
      return;
    }
    if (stepBack && !onStepEntry() && parse(location.hash).path === current.path) {
      pushStepEntry();
      stepBack();
      return;
    }
    emit();
    window.scrollTo(0, 0);
  });
  window.addEventListener("hashchange", emit);
}
