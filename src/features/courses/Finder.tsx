import { useId, useState, type ReactNode } from "react";
import type { CoursePrefs, SkillRef } from "@/data/types";
import { getDoc, update, useDoc } from "@/data/store";
import { useCommitOnLeave } from "@/data/hooks";
import { NeedCatalog } from "@/app/NeedCatalog";
import { useEscoReady } from "@/app/catalog";
import { closeSheet, openSheet } from "@/app/sheet";
import { toast } from "@/app/toast";
import { courseLink, jobLink, skName } from "@/domain/skills";
import { useLang, useT } from "@/i18n";
import {
  Button,
  Checkbox,
  Chips,
  Disclosure,
  ExternalLink,
  Field,
  Hint,
  Icon,
  Input,
  ToggleChip,
  PromptBox,
  SheetHead,
  Textarea,
} from "@/ui";
import { strings } from "./strings";
import {
  PREF_KEYS,
  PREF_OPTS,
  aiPrompt,
  finderCtx,
  officialTerm,
  prefLabel,
  prefsOf,
  prefsSummary,
  searchWords,
} from "./text";
import { alsoCandidates, keepFound, readFound, type FoundItem } from "./found";
import { FoundQueue } from "@/features/merge/sheets";
import { FoundList } from "./FoundList";
import { AlsoSheet } from "./AlsoSheet";
import { openItem } from "./api";
import type { FinderSpec, ItemKind } from "./types";

/* =================== FIND A COURSE / FIND JOB ADS ===================
   One sheet, three ways: the official search with the word filled in, search words for any search engine,
   and a prompt for any AI chat whose answer comes back through a paste box. Course wishes are asked once and
   kept in the profile. */

export function Finder(props: { kind: ItemKind; job: string | null; skill: SkillRef | null }) {
  return (
    <NeedCatalog>
      <FinderBody {...props} />
    </NeedCatalog>
  );
}

function FinderBody({ kind, job, skill }: { kind: ItemKind; job: string | null; skill: SkillRef | null }) {
  useCommitOnLeave();
  const t = useT(strings);
  const lang = useLang();
  const E = useEscoReady();
  const d = useDoc();
  const [url, setUrl] = useState("");
  const F: FinderSpec = { kind, job, skill, url };
  const c = finderCtx(d, E, F);
  const course = kind === "course";
  const term = officialTerm(c);
  const title =
    c.skill != null ? (c.skillEn && lang === "en" ? c.skillEn : skName(E, c.skill)) : (c.job?.title ?? "");
  const ids = { w1: useId(), w2: useId(), w3: useId() };

  return (
    <>
      <SheetHead
        icon={course ? "book" : "bag"}
        eyebrow={t(course ? "f_title_course" : "f_title_jobad")}
        title={title}
        sub={c.skill != null && c.job ? t("f_for", { x: c.job.title }) : undefined}
      />
      {course && <Wishes />}
      <ol className="flex flex-col gap-3" aria-label={t(course ? "f_title_course" : "f_title_jobad")}>
        <Way
          n={1}
          id={ids.w1}
          title={t(course ? "f_way1" : "f_way1j")}
          hint={t(course ? "f_way1_p" : "f_way1j_p")}
        >
          <ExternalLink
            href={course ? courseLink(term) : jobLink(c.goalDe, d.profile.location)}
            icon={false}
            className="group grid max-w-full grid-cols-[1fr_auto] items-center gap-x-3 self-start rounded-control bg-surface px-4 py-2.5 no-underline shadow-ring transition-shadow hover:shadow-ring-strong active:scale-[.99]"
          >
            <span className="text-caption font-bold text-ink-3">
              {t(course ? "f_way1_btn" : "f_way1j_btn")}
            </span>
            <b className="text-lead wrap-anywhere">{term}</b>
            <span className="col-start-2 row-span-2 row-start-1 text-ink-3 group-hover:text-ink">
              <Icon name="ext" />
            </span>
          </ExternalLink>
        </Way>
        <Way n={2} id={ids.w2} title={t("f_way2")} hint={t("f_way2_p")}>
          <PromptBox
            labelledBy={ids.w2}
            id="fwords"
            text={searchWords(d, E, F)}
            rows={2}
            small
            resetLabel={t("reset_words")}
          />
        </Way>
        <Way n={3} id={ids.w3} title={t("f_way3")} hint={t("f_way3_p")}>
          <Field label={t("f_link")} hint={t("f_link_p")}>
            {(p) => (
              <Input
                id={p.id}
                aria-describedby={p.hintId}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
          </Field>
          <PromptBox labelledBy={ids.w3} id="fai" text={aiPrompt(d, E, F, lang)} rows={10} />
          <PasteBack spec={F} />
        </Way>
      </ol>
      <div className="flex justify-center border-t border-line pt-3">
        <Button variant="ghost" onClick={() => openItem(kind, null, job, skill)}>
          <Icon name="plus" />
          {t("f_hand")}
        </Button>
      </div>
    </>
  );
}

/** One of the three ways: a number, a heading, a line, the content. */
function Way({
  n,
  id,
  title,
  hint,
  children,
}: {
  n: number;
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-card bg-surface-2 p-3.5 sm:gap-x-4 sm:p-[18px]">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-tile bg-ink font-display text-lead font-semibold text-canvas"
      >
        {n}
      </span>
      <div className="flex min-h-8 flex-col justify-center gap-0.5">
        <h3 id={id} className="text-title">
          {title}
        </h3>
        <Hint>{hint}</Hint>
      </div>
      {/* phones: the content takes the full width under the number; wider: it lines up with the heading */}
      <div className="col-span-2 flex min-w-0 flex-col gap-3 sm:col-span-1 sm:col-start-2">{children}</div>
    </li>
  );
}

/* ---------- course wishes: open the first time, then a closed line with the summary ---------- */
function Wishes() {
  const t = useT(strings);
  const lang = useLang();
  const P = useDoc((d) => d.profile);
  /* read once: the panel stays open while the person is choosing, although the first choice saves them */
  const [firstTime] = useState(() => !P.coursePrefs);
  const p = prefsOf(P);
  const set = (patch: Partial<CoursePrefs>) =>
    update((d) => void (d.profile.coursePrefs = { ...prefsOf(d.profile), ...patch }), { quiet: true });
  return (
    <Disclosure
      defaultOpen={firstTime}
      className="rounded-card bg-surface-2 shadow-ring-soft"
      buttonClassName="gap-3 rounded-card px-4 py-3 text-ink hover:text-ink"
      summary={
        <span className="flex flex-col">
          <b className="font-extrabold">{t("f_prefs")}</b>
          <span className="text-small font-bold text-ink-3">{prefsSummary(lang, P)}</span>
        </span>
      }
    >
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        <Hint>{t("f_prefs_p")}</Hint>
        {PREF_KEYS.map((k) => (
          <WishRow key={k} label={t(`p_${k}`)}>
            {PREF_OPTS[k].map((v) => (
              <ToggleChip
                key={v}
                pressed={p[k] === v}
                onClick={() => set({ [k]: v } as Partial<CoursePrefs>)}
              >
                {prefLabel(lang, P, k, v)}
              </ToggleChip>
            ))}
          </WishRow>
        ))}
        <Checkbox
          label={t("p_voucher")}
          checked={p.voucher}
          onChange={(e) => set({ voucher: e.target.checked })}
        />
      </div>
    </Disclosure>
  );
}
/** One wish: the label above its chips on phones (the chips get the full width), beside them on wider screens. */
function WishRow({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="grid gap-1.5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-3"
    >
      {/* sm:pt centres the label on the first row of 40px chips */}
      <span id={id} className="text-small font-extrabold sm:pt-2.5">
        {label}
      </span>
      <Chips>{children}</Chips>
    </div>
  );
}

/* ---------- the AI's answer comes back here ---------- */
function PasteBack({ spec }: { spec: FinderSpec }) {
  const t = useT(strings);
  const E = useEscoReady();
  const [text, setText] = useState("");
  const [found, setFound] = useState<FoundItem[] | null>(null);
  const [keep, setKeep] = useState<boolean[]>([]);
  const [round, setRound] = useState(0);
  const read = () => {
    const list = readFound(getDoc(), E, spec, text);
    setFound(list);
    setKeep(list.map(() => true));
    setRound((r) => r + 1);
  };
  const save = () => {
    if (!found) return;
    const chosen = found.filter((_, i) => keep[i]);
    let res: ReturnType<typeof keepFound> = { ids: [], matches: [] };
    update((d) => void (res = keepFound(d, spec, chosen)));
    const { ids, matches } = res;
    const d = getDoc();
    const list = spec.kind === "course" ? d.courses : d.jobads;
    if (ids.length)
      toast(
        t("t_added", {
          x: list
            .filter((x) => ids.includes(x.id))
            .map((x) => x.name)
            .join(", "),
        }),
      );
    /* then: is a new course for other goals too? */
    const after = () => {
      if (spec.kind === "course") {
        const all = [...ids, ...matches.map((m) => m.savedId)];
        const others = alsoCandidates(getDoc(), E, all);
        if (others.length) {
          openSheet(<AlsoSheet courseIds={all} jobIds={others.map((j) => j.id)} />, { label: t("f_also") });
          return;
        }
      }
      closeSheet();
    };
    /* found items that match saved ones are compared first, one at a time */
    if (matches.length)
      openSheet(<FoundQueue spec={spec} matches={matches} done={after} />, {
        label: t(spec.kind === "course" ? "f_title_course" : "f_title_jobad"),
      });
    else after();
  };
  return (
    <div className="mt-1 flex flex-col gap-3 border-t border-dashed border-line-2 pt-4">
      <Field label={t("f_back")} hint={t("f_back_p")}>
        {(p) => (
          <Textarea
            id={p.id}
            aria-describedby={p.hintId}
            rows={4}
            spellCheck={false}
            placeholder={t("f_back_ph")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="bg-surface"
          />
        )}
      </Field>
      <Button variant="primary" className="self-start" onClick={read}>
        <Icon name="spark" />
        {t("f_read")}
      </Button>
      <div aria-live="polite" className="flex flex-col gap-3">
        {found &&
          (found.length ? (
            <FoundList
              key={round}
              kind={spec.kind}
              items={found}
              keep={keep}
              onToggle={(i, v) => setKeep((k) => k.map((x, j) => (j === i ? v : x)))}
              onKeep={save}
            />
          ) : (
            <p
              key={round}
              className="flex items-start gap-2 rounded-control bg-no-bg px-3.5 py-3 text-small font-bold text-no [&_svg]:mt-px [&_svg]:size-4.5 [&_svg]:flex-none"
            >
              <Icon name="warn" />
              {t("f_none")}
            </p>
          ))}
      </div>
    </div>
  );
}
