// The fixtures were recorded from the previous app before its code was removed, so they are the reference answers.
import { describe, expect, it } from "vitest";
import type { Dict } from "@/i18n";
import { homeStrings } from "./strings";
import { editStrings } from "@/features/edit/strings";
import { backupStrings } from "@/features/backup/strings";
import recorded from "./__fixtures__/legacy-strings.json";

/* The copy of Home, Edit my data and Backup is taken over word for word from the previous app. This checks every
   string against the previous app's string tables (for profile.js and goals.js, only the labels Edit borrows). */

type Table = Record<"en" | "de", Record<string, string>>;

/** The strings a script of the previous app added with Object.assign(STR.en, {…}) and Object.assign(STR.de, {…}). */
function legacyStrings(file: string): Table {
  const t = (recorded as Record<string, Table>)[file];
  if (!t) throw new Error(`no strings recorded for ${file}`);
  return t;
}

function expectCopied(dict: Dict, files: string[], added: readonly string[] = []) {
  for (const lang of ["en", "de"] as const) {
    const legacy: Record<string, string> = {};
    files.forEach((f) => Object.assign(legacy, legacyStrings(f)[lang]));
    for (const [k, v] of Object.entries(dict[lang])) {
      if (added.includes(k)) continue;
      expect(legacy[k], `${lang}.${k} exists in the legacy app`).toBeDefined();
      expect(v, `${lang}.${k}`).toBe(legacy[k]);
    }
  }
}

/** A legacy script's keys, without those that now live where they are used. */
const legacyKeys = (file: string, moved: readonly string[]) =>
  Object.keys(legacyStrings(file).en)
    .filter((k) => !moved.includes(k))
    .sort();
const ownKeys = (dict: Dict, added: readonly string[] = []) =>
  Object.keys(dict.en)
    .filter((k) => !added.includes(k))
    .sort();

/* Strings that live elsewhere now: the install and "all deleted" toasts in main.tsx, the sample bar and its
   toasts in app/samples.ts, Edit's profile labels in i18n/profileFields (w_hobbies_s was never used). */
const HOME_MOVED = ["inst_done"];
/* the welcome and the sample hero, which the line replaced */
const HOME_DROPPED = [
  ...["h_back", "h_back0", "h_g_skills"],
  ...["h_sample_h", "h_sample_p", "h_sample_own", "h_sample_back"],
];
const EDIT_MOVED = ["w_situation", "w_hobbies_s"];
const BACKUP_MOVED = [
  ...["sb_text", "sb_back", "sb_own", "sb_switch"],
  ...["t_own_back", "t_own_start", "t_own_nokeep", "t_example", "fin_done"],
];
/* strings for UI the previous app did not have */
const EDIT_ADDED = ["e_filter", "e_filter_none"];
/* reworded on purpose: the main goal became the route you are on */
const EDIT_CHANGED = ["e_main"];
const BACKUP_ADDED = ["bk_choose", "bk_nofile"];
/* Home of a returning person: the line (l_), the next stops (n_), the stages (s_) */
const HOME_ADDED = Object.keys(homeStrings.en).filter((k) => /^[lns]_/.test(k));

describe("copy taken over from the previous app", () => {
  it("home: every string of home.js, word for word", () => {
    expectCopied(homeStrings, ["home.js"], HOME_ADDED);
    expect(ownKeys(homeStrings, HOME_ADDED)).toEqual(legacyKeys("home.js", [...HOME_MOVED, ...HOME_DROPPED]));
  });
  it("edit: every string of edit.js, plus the labels it borrows, word for word", () => {
    expectCopied(editStrings, ["edit.js", "profile.js", "goals.js"], [...EDIT_ADDED, ...EDIT_CHANGED]);
    for (const k of legacyKeys("edit.js", EDIT_MOVED)) expect(editStrings.en).toHaveProperty(k);
  });
  it("backup: every string of backup.js, word for word", () => {
    expectCopied(backupStrings, ["backup.js"], BACKUP_ADDED);
    expect(ownKeys(backupStrings, BACKUP_ADDED)).toEqual(legacyKeys("backup.js", BACKUP_MOVED));
  });
});
