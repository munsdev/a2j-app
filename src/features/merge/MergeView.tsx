import { useMemo, useState } from "react";
import type { SkillRef } from "@/data/types";
import { fieldDiffs, type DupeKind } from "@/data/dupes";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { skKey, skName } from "@/domain/skills";
import { COURSE_F, JOBAD_F, type TextField } from "@/features/courses/found";
import { labelKey } from "@/features/courses/labels";
import { strings as courseStrings } from "@/features/courses/strings";
import { useT } from "@/i18n";
import { Button, Chips, Choice, Hint, SheetHead, ToggleChip } from "@/ui";
import { strings } from "./strings";

/* =================== COMPARE TWO RECORDS ===================
   A new course, job ad or job that matches a saved one (mode "new"), or two saved ones that look the same
   (mode "pair", from the cleanup check). Only the fields that differ are shown, each with the two values to
   pick from; the rest is folded into one line. A course also shows the skills both cover, to untick what it
   does not teach. Then: merge (the saved one is updated, or the second goes into the first), keep both, or
   cancel. Used inside the course form (so Back keeps what was typed) and in its own sheet. */

const KEYS: Record<DupeKind, readonly string[]> = {
  course: [...COURSE_F, "azav"],
  jobad: JOBAD_F,
  job: ["title"],
};

export interface MergeChoice {
  /** the value to keep for each field that differed */
  values: Record<string, string>;
  /** a course's covered skills, as ticked */
  covers: SkillRef[] | null;
}

export function MergeView({
  kind,
  mode,
  saved,
  other,
  step,
  onMerge,
  onBoth,
  onCancel,
  cancelLabel,
}: {
  kind: DupeKind;
  mode: "new" | "pair";
  saved: Record<string, unknown>;
  other: Record<string, unknown>;
  step?: { i: number; n: number };
  onMerge: (c: MergeChoice) => void;
  onBoth: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const t = useT(strings, courseStrings);
  const E = useEsco();
  useLoadCatalog(kind === "course");
  const { diffs, same } = useMemo(() => fieldDiffs(KEYS[kind], saved, other), [kind, saved, other]);
  const [picks, setPicks] = useState<Record<string, "saved" | "other">>(() =>
    Object.fromEntries(diffs.map((x) => [x.k, x.pick])),
  );
  const allCovers = useMemo(() => {
    if (kind !== "course") return [];
    const out: SkillRef[] = [];
    for (const x of [...((saved.covers as SkillRef[]) ?? []), ...((other.covers as SkillRef[]) ?? [])])
      if (!out.some((y) => skKey(y) === skKey(x))) out.push(x);
    return out;
  }, [kind, saved, other]);
  const [off, setOff] = useState<ReadonlySet<string>>(() => new Set());

  const label = (k: string) =>
    kind === "job" ? t("m_title") : k === "azav" ? t("ce_azav") : t(labelKey(kind, k as TextField));
  const show = (k: string, v: string) =>
    !v
      ? t("m_empty")
      : k === "azav"
        ? t(v === "provider" ? "ce_azav_provider" : v === "no" ? "ce_azav_no" : "ce_azav_unknown")
        : v;
  const name = String(saved.name ?? saved.title ?? "");
  const [A, B] = mode === "new" ? [t("m_saved"), t("m_new")] : [t("m_first"), t("m_second")];
  const merge = () =>
    onMerge({
      values: Object.fromEntries(diffs.map((x) => [x.k, picks[x.k] === "other" ? x.other : x.saved])),
      covers: kind === "course" ? allCovers.filter((x) => !off.has(skKey(x))) : null,
    });

  return (
    <>
      <SheetHead
        icon="copy"
        eyebrow={
          (mode === "new" ? t("m_new_eyebrow") : t("m_pair_eyebrow")) +
          (step && step.n > 1 ? " · " + t("m_step", { i: step.i, n: step.n }) : "")
        }
        title={name}
        sub={kind === "job" ? t("m_p_job") : t("m_p")}
      />
      {diffs.length ? (
        <div className="flex flex-col gap-4">
          {diffs.map((x) => (
            <fieldset key={x.k} className="flex flex-col gap-2">
              <legend className="mb-1.5 text-label font-extrabold">{label(x.k)}</legend>
              {(["saved", "other"] as const).map((side) => (
                <Choice
                  key={side}
                  name={"merge-" + x.k}
                  checked={picks[x.k] === side}
                  onChange={() => setPicks((p) => ({ ...p, [x.k]: side }))}
                  label={
                    <span className="flex min-w-0 flex-col">
                      <span className="text-caption font-bold text-ink-3">{side === "saved" ? A : B}</span>
                      <span className="font-normal break-words">
                        {show(x.k, side === "saved" ? x.saved : x.other)}
                      </span>
                    </span>
                  }
                />
              ))}
            </fieldset>
          ))}
          {same > 0 && <Hint>{t("m_same", { n: same })}</Hint>}
        </div>
      ) : (
        <Hint>{mode === "new" ? t("m_nothing") : t("m_same_all")}</Hint>
      )}
      {allCovers.length > 0 && E && (
        <div className="flex flex-col gap-2">
          <p className="text-label font-extrabold">{t("m_covers")}</p>
          <Hint>{t("m_covers_p")}</Hint>
          <Chips>
            {allCovers.map((x) => {
              const on = !off.has(skKey(x));
              return (
                <ToggleChip
                  key={skKey(x)}
                  pressed={on}
                  onClick={() =>
                    setOff((s) => {
                      const n = new Set(s);
                      if (!n.delete(skKey(x))) n.add(skKey(x));
                      return n;
                    })
                  }
                >
                  {skName(E, x)}
                </ToggleChip>
              );
            })}
          </Chips>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={merge}>
          {mode === "new" ? t("m_update") : t("m_merge")}
        </Button>
        <Button onClick={onBoth}>{t("m_both")}</Button>
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel ?? t("m_cancel")}
        </Button>
      </div>
    </>
  );
}
