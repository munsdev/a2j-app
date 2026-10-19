import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/data/types";
import { commit, update, useDoc } from "@/data/store";
import { jobsIn } from "@/data/doc";
import { currentRoute, sortedRoutes, switchRoute } from "@/data/routes";
import { routeWords } from "@/features/routes/model";
import { NeedCatalog } from "@/app/NeedCatalog";
import { useEscoReady } from "@/app/catalog";
import { go } from "@/app/router";
import { useLang, useT } from "@/i18n";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { ActionBar, Button, EmptyState, Icon, Page, PageHeader, Segmented, Textarea } from "@/ui";
import { strings } from "./strings";
import { pageModel, pageText, planData, planState, suggestWhy, whyNow, type PlanState } from "./model";
import { Paper } from "./Paper";
import { Controls, type TextKey } from "./Controls";
import "./plan.css";

/* =================== PLAN: ONE PAGE FOR THE MEETING ===================
   Controls on the left (on phones: the Edit tab), the page on the right (the Page tab). Typing saves after a
   short pause and closes the undo step when the field is left. Print shows only the paper. */

export default function PlanScreen() {
  const t = useT(strings);
  const hasGoal = useDoc((d) => jobsIn(d, "goal").length > 0);
  if (!hasGoal)
    return (
      <Page>
        <PageHeader title={t("sm_title")} />
        <EmptyState
          size={72}
          title={t("sm_nogoal_h")}
          actions={
            <Button variant="primary" onClick={() => go("goals")}>
              {t("sm_nogoal_btn")}
              <Icon name="arrow" />
            </Button>
          }
        >
          {t("sm_nogoal_p")}
        </EmptyState>
      </Page>
    );
  return (
    <Page width="wide" className="print:max-w-none print:p-0">
      <PageHeader title={t("sm_title")} lede={t("sm_lede")} className="print:hidden" />
      <NeedCatalog>
        <Plan />
      </NeedCatalog>
    </Page>
  );
}

type Tab = "page" | "edit";

/** Write plan settings: the normalised state with a change on top. */
const patchPlan = (appLang: Lang, p: Partial<PlanState>, quiet = false) =>
  update((d) => void (d.summary = { ...planState(d, appLang), ...p }), { quiet });

function Plan() {
  const t = useT(strings);
  const appLang = useLang();
  const E = useEscoReady();
  const d = useDoc();
  const [tab, setTab] = useState<Tab>("page");
  /* text being typed, ahead of the debounced save */
  const [drafts, setDrafts] = useState<Partial<Record<TextKey, string>>>({});
  /* the same, for timers and handlers (always written together with the state) */
  const draftsRef = useRef<Partial<Record<TextKey, string>>>({});
  const setDraft = (k: TextKey, v: string | null) => {
    const n = { ...draftsRef.current };
    if (v == null) delete n[k];
    else n[k] = v;
    draftsRef.current = n;
    setDrafts(n);
  };
  const timers = useRef<Partial<Record<TextKey, ReturnType<typeof setTimeout>>>>({});
  const copyFallback = useRef<HTMLTextAreaElement>(null);

  const stored = planState(d, appLang);
  const s: PlanState = { ...stored, ...drafts };
  const x = planData(d, E, s);
  const why = drafts.why ?? whyNow(x);
  const model = pageModel(x, why, new Date());

  /* an untouched suggested start keeps up with the profile and the page language */
  const stale = drafts.why == null && !!stored.whyAuto && stored.why === stored.whyAuto && why !== stored.why;
  useEffect(() => {
    if (stale) patchPlan(appLang, { why, whyAuto: why }, true);
  }, [stale, why, appLang]);

  const save = (k: TextKey, v: string) => patchPlan(appLang, { [k]: v }, true);
  const flush = (k: TextKey) => {
    clearTimeout(timers.current[k]);
    delete timers.current[k];
    const v = draftsRef.current[k];
    if (v != null) save(k, v);
    setDraft(k, null);
    commit();
  };
  const flushAll = () => (Object.keys(draftsRef.current) as TextKey[]).forEach(flush);
  useEffect(
    () => () => {
      /* leaving the screen mid-sentence: keep the words */
      const dr = draftsRef.current;
      (Object.keys(timers.current) as TextKey[]).forEach((k) => {
        clearTimeout(timers.current[k]);
        if (dr[k] != null) patchPlan(appLang, { [k]: dr[k] }, true);
      });
      commit();
    },
    [appLang],
  );

  const type = (k: TextKey, v: string) => {
    setDraft(k, v);
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(() => {
      delete timers.current[k];
      save(k, v);
    }, 500);
  };

  const print = () => {
    flushAll();
    window.print();
  };
  const copy = () => void copyText(pageText(model), copyFallback.current);

  return (
    <>
      <Segmented
        label={t("sm_title")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "page", label: t("sm_tab_page") },
          { value: "edit", label: t("sm_tab_edit") },
        ]}
        className="min-[900px]:hidden print:hidden"
      />
      <div className="grid items-start gap-[18px] min-[900px]:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] print:block">
        <div className={cn("flex flex-col print:hidden", tab === "page" && "max-[899px]:hidden")}>
          {/* two columns: Print and Copy head the controls and stay in view while they scroll. The band of
              canvas around the card (under the 64px top bar) hides the controls as they pass beneath. */}
          <div className="sticky top-16 z-[1] -mt-4 bg-canvas pt-4 pb-[18px] max-[899px]:hidden">
            <div className="flex flex-col gap-2 rounded-panel bg-surface p-3 shadow-card">
              <Button variant="primary" wide onClick={print}>
                <Icon name="print" />
                {t("sm_print")}
              </Button>
              <Button wide onClick={copy}>
                <Icon name="copy" />
                {t("sm_copy")}
              </Button>
            </div>
          </div>
          <Controls
            s={s}
            why={why}
            routes={sortedRoutes(d).map((r) => {
              const w = routeWords(d, r);
              return {
                id: r.id,
                label: [r.id, w.job, w.course?.name ?? (w.direct ? t("sm_direct_short") : "")]
                  .filter(Boolean)
                  .join(" · "),
              };
            })}
            route={currentRoute(d)?.id ?? null}
            course={x.course}
            onInc={(k, v) => patchPlan(appLang, { inc: { ...stored.inc, [k]: v } })}
            onLang={(l) => patchPlan(appLang, { lang: l })}
            onRoute={(id) => update((dd) => switchRoute(dd, id))}
            onType={type}
            onBlur={flush}
            onSuggest={() => {
              flush("why");
              const sug = suggestWhy(x);
              patchPlan(appLang, { why: sug, whyAuto: sug });
            }}
          />
        </div>
        <div className={cn("paper", tab === "edit" && "max-[899px]:hidden")}>
          <Paper model={model} />
        </div>
      </div>
      <p className="flex items-center justify-center gap-2 text-center text-small text-ink-3 print:hidden [&_svg]:size-4.5 [&_svg]:flex-none [&_svg]:text-accent-ink">
        <Icon name="heart" />
        {t("sm_trust")}
      </p>
      {/* one column: one row at the bottom, Print as the main action and Copy beside it (an icon on phones) */}
      <ActionBar className="flex-nowrap min-[900px]:hidden print:hidden">
        <Button variant="primary" onClick={print}>
          <Icon name="print" />
          {t("sm_print")}
        </Button>
        <Button onClick={copy} title={t("sm_copy")} className="max-sm:w-12 max-sm:flex-none! max-sm:px-0">
          <Icon name="copy" />
          <span className="max-sm:sr-only">{t("sm_copy")}</span>
        </Button>
      </ActionBar>
      <Textarea
        ref={copyFallback}
        hidden
        readOnly
        rows={10}
        aria-label={t("sm_copy")}
        className="print:hidden"
      />
    </>
  );
}
