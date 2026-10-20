import { create } from "zustand";
import type { Lang } from "@/data/types";
import { storage } from "@/lib/storage";

/* Interface settings, per browser: language, colour theme, and whether an answer in the profile goes on to the
   next question by itself. Not part of the document or of backups. */

const LANG_KEY = "a2j:lang";
const THEME_KEY = "a2j:theme";
const AUTO_KEY = "a2j:autonext";
export type Theme = "light" | "dark";

/** A language chosen before wins; otherwise German browsers start in German, all others in English. */
function initialLang(): Lang {
  const l = storage.get(LANG_KEY);
  if (l === "en" || l === "de") return l;
  const b = (typeof navigator !== "undefined" && (navigator.languages?.[0] || navigator.language)) || "";
  return /^de\b/i.test(b) ? "de" : "en";
}

const darkMQ =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
const storedTheme = (): Theme | null => {
  const t = storage.get(THEME_KEY);
  return t === "light" || t === "dark" ? t : null;
};
const systemTheme = (): Theme => (darkMQ?.matches ? "dark" : "light");

interface SettingsState {
  lang: Lang;
  theme: Theme;
  /** the theme follows the system until the person picks one */
  themeAuto: boolean;
  /** an answer in the profile goes on to the next question by itself (on unless turned off) */
  autoNext: boolean;
}

export const useSettings = create<SettingsState>(() => ({
  lang: initialLang(),
  theme: storedTheme() ?? systemTheme(),
  themeAuto: !storedTheme(),
  autoNext: storage.get(AUTO_KEY) !== "0",
}));

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", t === "dark" ? "#131a18" : "#f3f1eb");
}

export function setLang(lang: Lang): void {
  if (useSettings.getState().lang === lang) return;
  storage.set(LANG_KEY, lang);
  document.documentElement.lang = lang;
  useSettings.setState({ lang });
}
export function setTheme(theme: Theme): void {
  storage.set(THEME_KEY, theme);
  applyTheme(theme);
  useSettings.setState({ theme, themeAuto: false });
}

export function setAutoNext(on: boolean): void {
  storage.set(AUTO_KEY, on ? "1" : "0");
  useSettings.setState({ autoNext: on });
}

/** Called once at start: sync <html> and follow the system theme while no theme is picked. */
export function initSettings(): void {
  const { lang, theme } = useSettings.getState();
  document.documentElement.lang = lang;
  applyTheme(theme);
  darkMQ?.addEventListener?.("change", () => {
    if (!useSettings.getState().themeAuto) return;
    const t = systemTheme();
    applyTheme(t);
    useSettings.setState({ theme: t });
  });
}
