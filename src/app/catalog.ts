import { useEffect } from "react";
import { type Esco, type Onet, loadCatalog, useCatalog } from "@/domain/catalog";
import { matchJobs, needsMatching } from "@/domain/skills";
import { getDoc, update, useDocStore } from "@/data/store";
import { useLang } from "@/i18n";
import { useSettings } from "./settings";

/* The catalogue in components: hooks, and keeping it in sync with the language and the saved jobs.
   Screens that need it wrap their content in <NeedCatalog> (NeedCatalog.tsx). */

/** The catalogue when it is loaded (in any language), otherwise null. Does not start loading. */
export const useEsco = (): Esco | null => useCatalog((s) => s.esco);
export const useOnet = (): Onet | null => useCatalog((s) => s.onet);
/** The catalogue inside <NeedCatalog>: always there. */
export function useEscoReady(): Esco {
  const e = useCatalog((s) => s.esco);
  if (!e) throw new Error("useEscoReady outside <NeedCatalog>");
  return e;
}

/** Start loading the catalogue from a component (for screens that show more once it is there). */
export function useLoadCatalog(when = true): void {
  const lang = useLang();
  useEffect(() => {
    if (when) void loadCatalog(lang);
  }, [lang, when]);
}

/** Keep the catalogue in the interface language and saved jobs matched to it. Call once at start. */
export function initCatalogSync(): void {
  const match = () => {
    const esco = useCatalog.getState().esco;
    if (esco && needsMatching(getDoc())) update((d) => void matchJobs(d, esco), { quiet: true });
  };
  useCatalog.subscribe((s, prev) => {
    if (s.esco !== prev.esco) match();
  });
  useDocStore.subscribe((s, prev) => {
    if (s.doc !== prev.doc && needsMatching(s.doc)) match();
  });
  useSettings.subscribe((s, prev) => {
    if (s.lang !== prev.lang && useCatalog.getState().esco) void loadCatalog(s.lang);
  });
  /* a person with jobs will need the catalogue soon: fetch it once the first screen is up */
  const d = getDoc();
  if (d.jobs.length || d.example) setTimeout(() => void loadCatalog(useSettings.getState().lang), 300);
}
