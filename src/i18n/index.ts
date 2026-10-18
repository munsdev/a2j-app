import { useMemo } from "react";
import type { Lang } from "@/data/types";
import { useSettings } from "@/app/settings";
import { common } from "./common";

/* =================== INTERFACE TEXT ===================
   Every feature defines its own strings next to its code with defineStrings(en, de). The German object
   must have exactly the English keys, so a missing translation is a type error, not a blank on screen.
   German uses Sie throughout. Placeholders: {name}. */

export type Strings = Record<string, string>;
export interface Dict<E extends Strings = Strings> {
  en: E;
  de: { [K in keyof E]: string };
}

export function defineStrings<const E extends Strings>(en: E, de: { [K in keyof E]: string }): Dict<E> {
  return { en, de };
}

/* distributes over the union of dictionaries, so the result is every key of every dictionary
   (keyof on a union would give only the keys they all share) */
type KeysOfDict<X> = X extends Dict ? keyof X["en"] & string : never;
type KeysOf<D extends readonly Dict[]> = KeysOfDict<D[number]>;
export type Vars = Record<string, string | number>;
export type Translate<K extends string> = (key: K, vars?: Vars) => string;
/** The keys of the shared strings, usable from every feature. */
export type CommonKey = keyof typeof common.en & string;

function fill(s: string, vars?: Vars): string {
  return vars ? s.replace(/\{(\w+)\}/g, (m, x: string) => (vars[x] != null ? String(vars[x]) : m)) : s;
}

/** A translate function for a fixed language (for example the printed plan, which has its own language). */
export function makeT<const D extends readonly Dict[]>(
  lang: Lang,
  ...dicts: D
): Translate<KeysOf<D> | CommonKey> {
  const all: readonly Dict[] = [...dicts, common];
  return (key, vars) => {
    for (const d of all) {
      const s = (d[lang] as Strings)[key];
      if (s != null) return fill(s, vars);
    }
    for (const d of all) {
      const s = d.en[key];
      if (s != null) return fill(s, vars);
    }
    return key;
  };
}

/** The current language. */
export const useLang = (): Lang => useSettings((s) => s.lang);

/** A translate function for the current language, over the given dictionaries and the shared strings. */
export function useT<const D extends readonly Dict[]>(...dicts: D): Translate<KeysOf<D> | CommonKey> {
  const lang = useLang();
  // dictionaries are module constants, so the language is the only real dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeT(lang, ...dicts), [lang]);
}

/** Pick the current language from a bilingual value: { en, de } or [en, de]-style content objects. */
export const pick = <T>(o: { en: T; de?: T }, lang: Lang): T => o[lang] ?? o.en;
