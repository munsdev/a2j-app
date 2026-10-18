import { useEffect, useState } from "react";
import { openExample } from "@/app/samples";
import {
  EXAMPLE_IDS,
  exampleName,
  examplePick,
  examplesLoaded,
  loadExamples,
  type ExampleId,
} from "@/data/examples";
import { useDoc } from "@/data/store";
import { useLang, useT } from "@/i18n";
import { Mascot, RowButton, SheetHead, type Mood } from "@/ui";
import { backupStrings } from "./strings";

const MOOD: Record<ExampleId, Mood> = { holmes: "think", robin: "wink", geppetto: "" };

/** The sheet to pick a sample profile. */
export function SamplePicker() {
  const t = useT(backupStrings);
  const lang = useLang();
  const current = useDoc((d) => d.example);
  const [ready, setReady] = useState(!!examplesLoaded());
  const [busy, setBusy] = useState<ExampleId | null>(null);
  useEffect(() => {
    let live = true;
    if (!ready) void loadExamples().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [ready]);

  return (
    <>
      <SheetHead title={t("pk_h")} sub={t("pk_p")} />
      {ready ? (
        <ul className="flex flex-col gap-2.5">
          {EXAMPLE_IDS.map((id) => (
            <li key={id}>
              <RowButton
                disabled={!!busy}
                aria-current={current === id ? "true" : undefined}
                aria-busy={busy === id || undefined}
                onClick={() => {
                  setBusy(id);
                  void openExample(id).finally(() => setBusy(null));
                }}
                lead={
                  <span className="flex size-14 items-center justify-center rounded-option bg-surface shadow-ring-soft">
                    <Mascot size={40} mood={MOOD[id]} className={busy === id ? "animate-bob" : ""} />
                  </span>
                }
                title={exampleName(id, lang)}
                detail={examplePick(id, lang)}
                className="disabled:cursor-wait aria-[current]:shadow-selected"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {EXAMPLE_IDS.map((id) => (
            <div key={id} className="h-20 animate-pulse rounded-option bg-surface-2" aria-hidden="true" />
          ))}
        </div>
      )}
    </>
  );
}
