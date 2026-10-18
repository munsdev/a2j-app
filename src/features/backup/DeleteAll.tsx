import { useId, useState } from "react";
import { useT } from "@/i18n";
import { Button, ButtonRow, Checkbox, Icon, SheetHead } from "@/ui";
import { deleteEverything, downloadBackup } from "./io";
import { backupStrings } from "./strings";

/** The Delete all data sheet: what it deletes, a warning, a confirm box that enables the button. */
export function DeleteAll() {
  const t = useT(backupStrings);
  const [ok, setOk] = useState(false);
  const warnId = useId();
  return (
    <>
      <SheetHead title={t("fin_h")} />
      <p className="text-ink-2">{t("fin_p")}</p>
      <p id={warnId} className="flex items-start gap-3 rounded-card bg-no-bg px-4 py-3.5 font-bold text-no">
        <Icon name="warn" className="mt-0.5 flex-none" />
        <span>{t("fin_warn")}</span>
      </p>
      <Checkbox
        label={t("fin_ok")}
        checked={ok}
        onChange={(e) => setOk(e.target.checked)}
        aria-describedby={warnId}
        className="min-h-11"
      />
      <ButtonRow className="mt-1 max-sm:flex-col max-sm:items-stretch">
        <Button onClick={downloadBackup}>
          <Icon name="download" />
          {t("bk_dl")}
        </Button>
        <Button variant="danger" disabled={!ok} onClick={() => ok && deleteEverything()}>
          <Icon name="trash" />
          {t("fin_go")}
        </Button>
      </ButtonRow>
    </>
  );
}
