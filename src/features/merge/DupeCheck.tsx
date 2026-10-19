import { useMemo } from "react";
import { useDoc } from "@/data/store";
import { dupePairs, type DupePair } from "@/data/dupes";
import { openSheet } from "@/app/sheet";
import { useT } from "@/i18n";
import { Button, Hint, Panel, PanelTitle } from "@/ui";
import { PairSheet } from "./sheets";
import { strings } from "./strings";

/* Edit my data: saved records that look like the same one, each with Compare. Nothing when there are none. */
export function DupeCheck() {
  const t = useT(strings);
  const d = useDoc();
  const pairs = useMemo(() => dupePairs(d), [d]);
  if (!pairs.length) return null;
  const name = (p: DupePair) => {
    const list: { id: string; name?: string; title?: string }[] =
      p.kind === "job" ? d.jobs : p.kind === "course" ? d.courses : d.jobads;
    const x = list.find((y) => y.id === p.a);
    return x?.name ?? x?.title ?? "";
  };
  return (
    <Panel aria-labelledby="dupes-h" className="shadow-[inset_0_0_0_2px_var(--course)]">
      <PanelTitle id="dupes-h">{t("k_title")}</PanelTitle>
      <Hint>{t("k_p")}</Hint>
      <ul className="flex flex-col gap-2">
        {pairs.map((p) => (
          <li
            key={p.kind + p.a + p.b}
            className="flex flex-wrap items-center justify-between gap-2 rounded-option bg-surface-2 py-2 pr-2 pl-4"
          >
            <span className="min-w-0 font-bold break-words">
              {t(p.kind === "course" ? "k_course" : p.kind === "jobad" ? "k_jobad" : "k_job", { x: name(p) })}
            </span>
            <Button size="sm" onClick={() => openSheet(<PairSheet pair={p} />, { label: t("k_title") })}>
              {t("k_compare")}
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
