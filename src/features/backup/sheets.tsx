import { openSheet } from "@/app/sheet";
import { backToOwn, ownKept } from "@/app/samples";
import { useSettings } from "@/app/settings";
import { getDoc } from "@/data/store";
import { makeT } from "@/i18n";
import { DeleteAll } from "./DeleteAll";
import { SamplePicker } from "./SamplePicker";
import { backupStrings } from "./strings";

/* CONTRACT (used by the top bar menu, the sample bar and Home):
   openSamplePicker(): the sheet to pick a sample profile (calls openExample from @/app/samples).
   openDeleteAll(): the "Delete all data" sheet. */

const t = () => makeT(useSettings.getState().lang, backupStrings);

export function openSamplePicker(): void {
  openSheet(<SamplePicker />, { label: t()("pk_h") });
}

export function openDeleteAll(): void {
  /* with a sample open, bring the person's own profile back first, so "Download backup file" saves theirs */
  if (getDoc().example && ownKept()) backToOwn();
  openSheet(<DeleteAll />, { label: t()("fin_h") });
}
