import { clearHistory, getDoc, markExported } from "@/data/store";
import { session, storage } from "@/lib/storage";
import { useSettings } from "@/app/settings";
import { toast } from "@/app/toast";
import { makeT } from "@/i18n";
import { backupName, exportDoc } from "./model";
import { backupStrings } from "./strings";

/* Saving a backup and deleting everything. Used by the Backup screen and the Delete all data sheet. */

const t = () => makeT(useSettings.getState().lang, backupStrings);

export function downloadBackup(): void {
  const d = getDoc();
  try {
    const url = URL.createObjectURL(new Blob([exportDoc(d)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = backupName(d.profile.name || "");
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(t()("bk_dl_done"));
    markExported();
  } catch {
    toast(t()("bk_dl_fail"), { bad: true });
  }
}

/** Delete everything the app keeps in this browser, then start again as on the first visit. */
export function deleteEverything(): void {
  storage.removeAppKeys();
  session.clear();
  session.set("a2j:finished", "1");
  clearHistory();
  /* reload, so no undo steps or typed text stay in memory; the sheet's history entry becomes #home */
  location.replace(location.pathname + location.search + "#home");
  location.reload();
}
