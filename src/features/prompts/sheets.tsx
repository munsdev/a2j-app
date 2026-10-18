import { useProfileEpoch } from "@/app/samples";
import { create } from "zustand";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { useDoc } from "@/data/store";
import { normTxt } from "@/domain/catalog";
import { useLang, useT } from "@/i18n";
import { useId } from "react";
import {
  Button,
  Field,
  FieldGrid,
  Icon,
  PromptBox,
  RowButton,
  SheetHead,
  SuggestInput,
  type IconName,
} from "@/ui";
import { openPromptItem, openPrompts } from "./api";
import {
  LIB,
  libContains,
  libText,
  namesFor,
  type PromptChoices,
  type PromptKey,
  type PromptOpt,
} from "./library";
import { strings } from "./strings";

/* =================== AI PROMPTS ===================
   The library: a list of ready-made prompts, each opening its own sheet with a few choices and the text in an
   editable box with Copy and Reset. The choices are kept for the visit. */

const useChoices = create<Partial<Record<PromptKey, PromptChoices>>>(() => ({}));
/* the choices name the person's jobs: forget them when another profile opens */
useProfileEpoch.subscribe(() => useChoices.setState({}, true));

/** An icon per prompt, so the list can be scanned. */
const ICON: Record<PromptKey, IconName> = {
  dayjob: "bag",
  translate: "flip",
  interview: "person",
  meeting: "doc",
  compare: "grid",
  funding: "shield",
  underrated: "search",
  patterns: "spark",
  newdirs: "globe",
};

export function PromptsList() {
  const t = useT(strings);
  return (
    <>
      <SheetHead title={t("ai_h")} sub={t("ai_p")} />
      <ul className="flex flex-col gap-2">
        {LIB.map((it) => (
          <li key={it.k}>
            <RowButton
              icon={ICON[it.k]}
              title={t(`plt_${it.k}`)}
              detail={t(`pld_${it.k}`)}
              onClick={() => openPromptItem(it.k)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

const LABEL: Record<PromptOpt, "pl_job" | "pl_goal" | "pl_past"> = {
  job: "pl_job",
  goal: "pl_goal",
  past: "pl_past",
};

export function PromptItem({ k }: { k: PromptKey }) {
  const t = useT(strings);
  const lang = useLang();
  const d = useDoc();
  /* skill names and gaps come from the catalogue: start loading it, the text fills in when it is there */
  useLoadCatalog();
  const E = useEsco();
  const it = LIB.find((x) => x.k === k)!;
  const choices = useChoices((s) => s[k]) ?? {};
  const titleId = useId();
  const set = (n: PromptOpt, v: string) => useChoices.setState((s) => ({ [k]: { ...s[k], [n]: v } }));
  return (
    <>
      <Button variant="ghost" size="sm" className="-mt-1 -ml-2 self-start" onClick={openPrompts}>
        <Icon name="back" />
        {t("ai_h")}
      </Button>
      <SheetHead title={<span id={titleId}>{t(`plt_${k}`)}</span>} sub={t(`pld_${k}`)} />
      {it.opts.length > 0 && (
        <FieldGrid>
          {it.opts.map((n) => {
            const list = namesFor(d, n === "past" ? "done" : "goal");
            const value = choices[n] ?? list[0] ?? "";
            const q = normTxt(value);
            /* a name from the list: offer the others; typed words: the names that contain them */
            const sugg = list.some((x) => normTxt(x) === q)
              ? list.filter((x) => normTxt(x) !== q)
              : list.filter((x) => normTxt(x).includes(q));
            return (
              <Field key={n} label={t(LABEL[n])}>
                {(p) => (
                  <SuggestInput id={p.id} value={value} onValueChange={(v) => set(n, v)} suggestions={sugg} />
                )}
              </Field>
            );
          })}
        </FieldGrid>
      )}
      <p className="flex items-start gap-2 rounded-control bg-surface-2 px-3.5 py-2.5 text-small text-ink-2 [&_svg]:mt-px [&_svg]:size-4.5 [&_svg]:flex-none [&_svg]:text-ink-3">
        <Icon name="shield" />
        {libContains(d, E, lang, it)}
      </p>
      <PromptBox labelledBy={titleId} id={`lib_${k}`} text={libText(d, E, lang, k, choices)} rows={12} />
    </>
  );
}
