import { useState } from "react";
import type { Course, JobAd } from "@/data/types";
import { getDoc, update, useDoc } from "@/data/store";
import { mergeJobs, notDupe, type DupePair, type ItemKind } from "@/data/dupes";
import { closeSheet } from "@/app/sheet";
import { toast } from "@/app/toast";
import { addFound, type FoundMatch } from "@/features/courses/found";
import type { FinderSpec } from "@/features/courses/types";
import { useT } from "@/i18n";
import { Button } from "@/ui";
import { MergeView } from "./MergeView";
import { mergeInto } from "./actions";
import { strings } from "./strings";

/* The duplicate check's sheets: the found items that match saved ones, one after another; and a pair of saved
   records from the cleanup check. */

const listOf = (d: ReturnType<typeof getDoc>, kind: ItemKind): (Course | JobAd)[] =>
  kind === "course" ? d.courses : d.jobads;

/** The found items that match saved ones, compared one at a time. Then done() (the "also for" sheet). */
export function FoundQueue({
  spec,
  matches,
  done,
}: {
  spec: FinderSpec;
  matches: FoundMatch[];
  done: () => void;
}) {
  const t = useT(strings);
  const d = useDoc();
  const [i, setI] = useState(0);
  const m = matches[i];
  const saved = m ? listOf(d, spec.kind).find((x) => x.id === m.savedId) : undefined;
  const next = () => (i + 1 < matches.length ? setI(i + 1) : done());
  /* the saved one was removed meanwhile (an Undo): nothing to compare, a button goes on */
  if (!m || !saved)
    return (
      <Button variant="primary" className="self-start" onClick={next}>
        {t("m_next")}
      </Button>
    );
  const other = { name: m.item.name, ...m.item.fields, azav: m.item.azav, covers: m.item.covers };
  return (
    <MergeView
      key={i}
      kind={spec.kind}
      mode="new"
      saved={saved as unknown as Record<string, unknown>}
      other={other}
      step={{ i: i + 1, n: matches.length }}
      onMerge={(c) => {
        mergeInto(spec.kind, saved.id, c, spec.job ? [spec.job] : []);
        toast(t("m_merged", { x: saved.name }));
        next();
      }}
      onBoth={() => {
        update((dr) => void addFound(dr, spec, m.item));
        toast(t("m_kept"));
        next();
      }}
      onCancel={next}
    />
  );
}

/** Two saved records the cleanup check found: merge the second into the first, or say they differ. */
export function PairSheet({ pair }: { pair: DupePair }) {
  const t = useT(strings);
  const d = useDoc();
  const list: { id: string }[] = pair.kind === "job" ? d.jobs : listOf(d, pair.kind);
  const a = list.find((x) => x.id === pair.a);
  const b = list.find((x) => x.id === pair.b);
  if (!a || !b) return null;
  const name = (x: object) =>
    String((x as { name?: string; title?: string }).name ?? (x as { title: string }).title);
  return (
    <MergeView
      kind={pair.kind}
      mode="pair"
      saved={a as unknown as Record<string, unknown>}
      other={b as unknown as Record<string, unknown>}
      onMerge={(c) => {
        if (pair.kind === "job") update((dr) => mergeJobs(dr, pair.a, pair.b, c.values.title));
        else mergeInto(pair.kind, pair.a, c, [], pair.b);
        closeSheet();
        toast(t("m_merged", { x: c.values.title ?? c.values.name ?? name(a) }));
      }}
      onBoth={() => {
        update((dr) => notDupe(dr, pair));
        closeSheet();
        toast(t("m_kept"));
      }}
      onCancel={closeSheet}
    />
  );
}
