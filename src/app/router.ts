import { useSyncExternalStore } from "react";
import { useSheetStore, closeSheetSilently } from "./sheet";

/* =================== ROUTES ===================
   Hash routes, so the app works as static files anywhere and old links keep working:
   #home · #profile · #profile/<part> · #goals · #goals/ideas · #goals/job/<id> · #goals/compare · #plan
   #edit/<tab> · #backup. Every screen change is a history step, so browser and Android Back return to the
   previous screen; Back closes an open sheet first. */

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

/** Go to a screen: go("goals/job/j3"). replace=true changes the current history entry instead of adding one. */
export function go(path: string, opts: { replace?: boolean } = {}): void {
  const h = "#" + path;
  const sheetOpen = useSheetStore.getState().open;
  if (sheetOpen) closeSheetSilently();
  if (location.hash !== h) {
    try {
      // an open sheet has its own history entry: take it over, so Back goes where the person expects
      if (opts.replace || sheetOpen) history.replaceState(null, "", h);
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
    emit();
    window.scrollTo(0, 0);
  });
  window.addEventListener("hashchange", emit);
}
