import { create } from "zustand";
import type { Doc, Lang } from "@/data/types";
import { emptyDoc, hasOwnData, shape } from "@/data/doc";
import { OWN_KEY, getDoc, replaceDoc, replaceSilently } from "@/data/store";
import { exampleDoc, loadExamples } from "@/data/examples";
import { storage } from "@/lib/storage";
import { defineStrings, makeT } from "@/i18n";
import { useSettings, setLang } from "./settings";
import { toast, toastUndo } from "./toast";
import { go } from "./router";
import { resetAllPrompts } from "./prompts";

/* =================== SAMPLES AND THE PERSON'S OWN PROFILE ===================
   Opening a sample keeps the person's own profile aside under its own key; "Back to my profile" brings it
   back. An unchanged sample follows the interface language. */

/* sample strings live here because the menu, the sample bar and Home all use them */
export const sampleStrings = defineStrings(
  {
    sb_text: "Sample: {x}",
    sb_back: "Back to my profile",
    sb_own: "Start my own",
    sb_switch: "Switch",
    t_own_back: "Your own profile is back",
    t_own_start: "Started a new, empty profile",
    t_own_nokeep:
      "Your profile could not be kept aside, so the sample was not opened. Download a backup first.",
    t_example: "Sample loaded",
  },
  {
    sb_text: "Beispiel: {x}",
    sb_back: "Zurück zu meinem Profil",
    sb_own: "Mein eigenes starten",
    sb_switch: "Wechseln",
    t_own_back: "Ihr eigenes Profil ist wieder da",
    t_own_start: "Neues, leeres Profil gestartet",
    t_own_nokeep:
      "Ihr Profil konnte nicht beiseitegelegt werden, darum wurde das Beispiel nicht geöffnet. Laden Sie zuerst eine Sicherung herunter.",
    t_example: "Beispiel geladen",
  },
);

const t = () => makeT(useSettings.getState().lang, sampleStrings);

/** Bumps when another profile opens, so screens can drop their per-visit state (open runs, idea decks). */
export const useProfileEpoch = create<{ epoch: number }>(() => ({ epoch: 0 }));
export const bumpEpoch = () => useProfileEpoch.setState((s) => ({ epoch: s.epoch + 1 }));

export const ownKept = (): boolean => !!storage.get(OWN_KEY);

function keepOwn(): boolean {
  const d = getDoc();
  if (!hasOwnData(d)) return true;
  return storage.setChecked(OWN_KEY, JSON.stringify(d));
}

/** Open a sample profile. */
export async function openExample(id: string): Promise<void> {
  if (!getDoc().example && !keepOwn()) {
    toast(t()("t_own_nokeep"), { bad: true });
    return;
  }
  await loadExamples();
  replaceDoc(exampleDoc(id, useSettings.getState().lang));
  resetAllPrompts();
  bumpEpoch();
  toastUndo(t()("t_example"));
  go("home");
}

export function backToOwn(): boolean {
  const raw = storage.get(OWN_KEY);
  if (!raw) return false;
  try {
    replaceDoc(shape(JSON.parse(raw)));
  } catch {
    return false;
  }
  storage.remove(OWN_KEY);
  resetAllPrompts();
  bumpEpoch();
  toast(t()("t_own_back"));
  go("home");
  return true;
}

export function startOwn(): void {
  storage.remove(OWN_KEY);
  replaceDoc(emptyDoc());
  resetAllPrompts();
  bumpEpoch();
  toastUndo(t()("t_own_start"));
  go("home");
}

/** A backup was restored or data replaced: drop per-visit state. */
export function profileReplaced(): void {
  resetAllPrompts();
  bumpEpoch();
}

const core = (d: Doc) =>
  JSON.stringify(
    (["profile", "assess", "jobs", "esco", "courses", "jobads"] as const).map((k) => d[k] ?? null),
  );
function sampleUnchanged(d: Doc): boolean {
  if (!d.example) return false;
  return (["en", "de"] as Lang[]).some((l) => {
    try {
      return core(d) === core(exampleDoc(d.example!, l));
    } catch {
      return false;
    }
  });
}

/** Switch the interface language. An unchanged sample switches with it. */
export async function changeLang(lang: Lang): Promise<void> {
  const d = getDoc();
  if (d.example) {
    const ok = await loadExamples().then(
      () => true,
      () => false,
    );
    if (ok && sampleUnchanged(d)) replaceSilently(exampleDoc(d.example, lang));
  }
  resetAllPrompts();
  setLang(lang);
}
