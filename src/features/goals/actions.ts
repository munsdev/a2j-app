import { getDoc, update } from "@/data/store";
import { jobById, makeGoal, removeJob } from "@/data/doc";
import { setVote } from "@/domain/rank";
import { go } from "@/app/router";
import { closeSheet, useSheetStore } from "@/app/sheet";
import { toast, toastUndo } from "@/app/toast";
import { useSettings } from "@/app/settings";
import { makeT } from "@/i18n";
import { strings } from "./strings";

/* What the job page, its menu and compare do to the document. Each is one undo step with a toast. */

const t = () => makeT(useSettings.getState().lang, strings);

/** Make a saved job a goal (the main goal when there is none yet) and open its page. */
export function makeGoalAndOpen(id: string): void {
  const j = jobById(getDoc(), id);
  if (!j) return;
  update((d) => {
    makeGoal(d, id);
    if (j.occ != null && j.occ >= 0) setVote(d, j.occ, 1);
  });
  toast(t()("d_made", { x: j.title }));
  go("goals/job/" + id);
}

/** Make a goal the main goal: the board, the courses and the Plan follow it. */
export function makeMain(id: string): void {
  const j = jobById(getDoc(), id);
  if (!j) return;
  closeSheet();
  update((d) => void (d.mainGoal = id));
  toast(t()("d_made", { x: j.title }));
}

/** Take a job off the list, with Undo, and go back to the overview in place of its page. */
export function removeWithUndo(id: string): void {
  const j = jobById(getDoc(), id);
  if (!j) return;
  update((d) => removeJob(d, id));
  toastUndo(t()("d_removed", { x: j.title }));
  const leave = () => go("goals", { replace: true });
  // the open menu sheet has its own history entry: let Back drop it first, then replace the job page
  if (useSheetStore.getState().open && (history.state as { sheet?: boolean } | null)?.sheet) {
    window.addEventListener("popstate", leave, { once: true });
    closeSheet();
  } else leave();
}
