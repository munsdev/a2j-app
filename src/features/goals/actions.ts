import { getDoc, update } from "@/data/store";
import { jobById, removeJob } from "@/data/doc";
import { routeForJob } from "@/data/routes";
import { goRoute, startRoute } from "@/features/routes/actions";
import { setVote } from "@/domain/rank";
import { go } from "@/app/router";
import { closeSheet, useSheetStore } from "@/app/sheet";
import { toastUndo } from "@/app/toast";
import { useSettings } from "@/app/settings";
import { makeT } from "@/i18n";
import { strings } from "./strings";

/* What the job page, its menu and compare do to the document. Each is one undo step with a toast. */

const t = () => makeT(useSettings.getState().lang, strings);

/** Start a route to a saved job (asks which route it replaces when all three are taken) and open its page. */
export function makeGoalAndOpen(id: string): void {
  const j = jobById(getDoc(), id);
  if (!j) return;
  if (j.occ != null && j.occ >= 0) update((d) => setVote(d, j.occ!, 1), { quiet: true });
  startRoute(id);
  go("goals/job/" + id);
}

/** Go onto the route to a job: the board, the courses and the Plan follow it. */
export function makeMain(id: string): void {
  const r = routeForJob(getDoc(), id);
  if (!r) return;
  closeSheet();
  goRoute(r.id);
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
