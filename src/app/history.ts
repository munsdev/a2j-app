import type { Doc } from "@/data/types";
import { hasOwnData } from "@/data/doc";
import { OWN_KEY, getDoc, redoDoc, undoDoc } from "@/data/store";
import { storage } from "@/lib/storage";
import { makeT } from "@/i18n";
import { useSettings } from "./settings";
import { toast } from "./toast";
import { bumpEpoch } from "./samples";
import { resetAllPrompts } from "./prompts";

/* Undo and redo with feedback, for the toast button and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
   Opening a sample, going back to one's own profile and restoring a backup are undo steps too. Two rules keep
   those safe:
   - the person's own profile is never only in the undo history: when a step brings a sample back on screen,
     the own profile that was showing is kept aside again (a2j:own), as when the sample was first opened;
   - when a step swaps in a different profile, per-visit screen state (idea deck, flipped cards, prompt
     choices) starts fresh, as it does after any other profile switch. */

const t = () => makeT(useSettings.getState().lang);
const jobIds = (d: Doc) => d.jobs.map((j) => j.id).join(",");

function afterSwap(before: Doc): void {
  const now = getDoc();
  if (now.example && !before.example && hasOwnData(before)) storage.set(OWN_KEY, JSON.stringify(before));
  if (!now.example && before.example && storage.get(OWN_KEY)) {
    // the own profile is on screen again: the copy kept aside is no longer needed if it is the same one
    if (storage.get(OWN_KEY) === JSON.stringify(now)) storage.remove(OWN_KEY);
  }
  if (now.example !== before.example || jobIds(now) !== jobIds(before)) {
    resetAllPrompts();
    bumpEpoch();
  }
}

export function performUndo(): void {
  const before = getDoc();
  if (!undoDoc()) return;
  afterSwap(before);
  toast(t()("t_undone"));
}
export function performRedo(): void {
  const before = getDoc();
  if (!redoDoc()) return;
  afterSwap(before);
  toast(t()("t_redone"));
}
