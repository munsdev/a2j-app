import { useId, useState, type FormEvent, type ReactNode } from "react";
import type { Course, ItemStatus, JobAd, SkillRef } from "@/data/types";
import { getDoc, update, useDoc } from "@/data/store";
import { itemMatch } from "@/data/dupes";
import { MergeView } from "@/features/merge/MergeView";
import { mergeInto } from "@/features/merge/actions";
import { strings as mergeStrings } from "@/features/merge/strings";
import { jobById, safeUrl, uid } from "@/data/doc";
import { NeedCatalog } from "@/app/NeedCatalog";
import { useEscoReady } from "@/app/catalog";
import { closeSheet } from "@/app/sheet";
import { toast, toastUndo } from "@/app/toast";
import { normTxt } from "@/domain/catalog";
import { jobTiles, skKey, skName } from "@/domain/skills";
import { fillRouteCourse } from "@/data/routes";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import {
  Button,
  Chips,
  DeleteButton,
  Disclosure,
  ExternalLink,
  Field,
  FieldGrid,
  Hint,
  Icon,
  Input,
  Select,
  SheetHead,
  Tag,
  Textarea,
  ToggleChip,
  useSheetFocus,
} from "@/ui";
import { strings } from "./strings";
import { COURSE_F, JOBAD_F, fieldsOf, type TextField } from "./found";
import { labelKey } from "./labels";
import type { ItemKind } from "./types";

/* =================== THE SHORT FORM FOR A COURSE OR A JOB AD ===================
   The few fields that matter up front, the rest under "More details". The draft lives in the form;
   Save writes it in one step (one Undo). Save and Delete stay in view at the bottom of the sheet. */

const STATUSES: readonly ItemStatus[] = ["interested", "contacted", "applied", "rejected", "accepted"];
type Azav = NonNullable<Course["azav"]>;
type Fields = Partial<Record<TextField, string>>;
interface DraftItem {
  fields: Fields;
  goals: string[];
  covers: SkillRef[];
  status: ItemStatus;
  azav: Azav;
}
const SHORT: Record<ItemKind, readonly TextField[]> = {
  course: ["name", "provider", "url", "start"],
  jobad: ["name", "org", "place", "url", "deadline"],
};
const MORE: Record<ItemKind, readonly TextField[]> = {
  course: ["length", "schedule", "format", "language", "price", "funding", "cert", "notes"],
  jobad: ["hours", "pay", "reqs", "notes"],
};
const LONG: readonly TextField[] = ["notes", "reqs"];
/** Show a filter over the skills from this many on. */
const FILTER_FROM = 12;

/** The given text fields that hold words, trimmed. */
function filled<K extends TextField>(
  keys: readonly K[],
  from: Partial<Record<K, string>>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const k of keys) {
    const v = (from[k] ?? "").trim();
    if (v) out[k] = v;
  }
  return out;
}

function draftOf(ex: Course | JobAd | undefined, jobId: string | null, skill: SkillRef | null): DraftItem {
  if (!ex)
    return {
      fields: {},
      goals: jobId ? [jobId] : [],
      covers: skill != null ? [skill] : [],
      status: "interested",
      azav: "",
    };
  const base = { goals: [...ex.goals], status: ex.status || "interested" };
  return "covers" in ex
    ? { ...base, fields: filled(COURSE_F, ex), covers: [...ex.covers], azav: ex.azav || "" }
    : { ...base, fields: filled(JOBAD_F, ex), covers: [], azav: "" };
}

/* The saved records, built field by field so the compiler checks every required one. */
type Meta = { id: string; source: Course["source"]; goals: string[] };
const sourceOf = (m: Meta) => (m.source ? { source: m.source } : {});

function buildCourse(x: DraftItem, m: Meta): Course {
  const { name = "", ...rest } = filled(COURSE_F, x.fields);
  return {
    ...rest,
    id: m.id,
    name,
    goals: m.goals,
    covers: x.covers,
    status: x.status,
    ...(x.azav ? { azav: x.azav } : {}),
    ...sourceOf(m),
  };
}
function buildJobad(x: DraftItem, m: Meta): JobAd {
  const { name = "", ...rest } = filled(JOBAD_F, x.fields);
  return { ...rest, id: m.id, name, goals: m.goals, status: x.status, ...sourceOf(m) };
}

export function ItemForm({
  kind,
  id,
  jobId,
  skill = null,
}: {
  kind: ItemKind;
  id: string | null;
  jobId: string | null;
  /** a new course opened for this skill (from "Find a course" for a skill) starts with it ticked */
  skill?: SkillRef | null;
}) {
  const t = useT(strings);
  const tm = useT(mergeStrings);
  const course = kind === "course";
  const P = course ? "ce_" : "ae_";
  const saved = useDoc((d) => (course ? d.courses : d.jobads).find((x) => x.id === id));
  const jobs = useDoc((d) => d.jobs);
  const [draft, setDraft] = useState<DraftItem>(() =>
    draftOf(saved, jobId, kind === "course" ? skill : null),
  );
  const [nameErr, setNameErr] = useState(false);
  const nameRef = useSheetFocus<HTMLInputElement>();
  const forId = useId();
  const isNew = !id;

  const setField = (k: TextField, v: string) => setDraft((x) => ({ ...x, fields: { ...x.fields, [k]: v } }));
  const toggle = <T,>(list: T[], v: T, key: (x: T) => string = String) =>
    list.some((x) => key(x) === key(v)) ? list.filter((x) => key(x) !== key(v)) : [...list, v];

  /* a new one that matches a saved one: compare first (Back returns to the form, nothing lost) */
  const [dupe, setDupe] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!(draft.fields.name || "").trim()) {
      setNameErr(true);
      toast(t("ce_need_name"), { bad: true });
      nameRef.current?.focus();
      return;
    }
    if (isNew) {
      const d = getDoc();
      const m = itemMatch(kind, course ? d.courses : d.jobads, filled(fieldsOf(kind), draft.fields));
      if (m) return setDupe(m.id);
    }
    save();
  };
  const save = () => {
    update((d) => {
      const goals = draft.goals.filter((g) => d.jobs.some((j) => j.id === g));
      if (course) {
        const list = d.courses;
        const i = list.findIndex((y) => y.id === id);
        if (i >= 0) list[i] = buildCourse(draft, { id: list[i].id, source: list[i].source, goals });
        else {
          const c = buildCourse(draft, { id: uid("c", list), source: "hand", goals });
          list.push(c);
          /* a route to one of its jobs without a course takes it */
          goals.forEach((g) => fillRouteCourse(d, c.id, g));
        }
      } else {
        const list = d.jobads;
        const i = list.findIndex((y) => y.id === id);
        if (i >= 0) list[i] = buildJobad(draft, { id: list[i].id, source: list[i].source, goals });
        else list.push(buildJobad(draft, { id: uid("a", list), source: "hand", goals }));
      }
    });
    toast(t("t_saved"));
    closeSheet();
  };

  const remove = () => {
    if (!id) return;
    const name = saved?.name ?? "";
    update((d) => {
      if (course) d.courses = d.courses.filter((x) => x.id !== id);
      else d.jobads = d.jobads.filter((x) => x.id !== id);
    });
    closeSheet();
    toastUndo(t("t_deleted", { x: name }));
  };

  const link = safeUrl(draft.fields.url);
  const field = (k: TextField): ReactNode => {
    const long = LONG.includes(k);
    const isName = k === "name";
    return (
      <Field
        key={k}
        wide={long || isName}
        label={t(labelKey(kind, k))}
        hint={isName && nameErr ? <span className="font-bold text-no">{t("ce_need_name")}</span> : undefined}
      >
        {(p) =>
          long ? (
            <Textarea
              id={p.id}
              rows={2}
              value={draft.fields[k] ?? ""}
              onChange={(e) => setField(k, e.target.value)}
            />
          ) : (
            <div className="relative">
              <Input
                id={p.id}
                ref={isName && isNew ? nameRef : undefined}
                type={k === "url" ? "url" : "text"}
                inputMode={k === "url" ? "url" : undefined}
                placeholder={k === "url" ? "https://" : undefined}
                autoComplete="off"
                aria-invalid={isName && nameErr ? true : undefined}
                aria-describedby={isName && nameErr ? p.hintId : undefined}
                value={draft.fields[k] ?? ""}
                onChange={(e) => {
                  setField(k, e.target.value);
                  if (isName && e.target.value.trim()) setNameErr(false);
                }}
                className={cn(
                  isName && nameErr && "border-no focus:border-no",
                  k === "url" && link && "pr-12",
                )}
              />
              {k === "url" && link && (
                <ExternalLink
                  href={link}
                  title={t("open_link")}
                  className="absolute top-1 right-1 size-10 justify-center rounded-tile text-ink-3 hover:bg-surface-2 hover:text-ink"
                >
                  <span className="sr-only">{t("open_link")}</span>
                </ExternalLink>
              )}
            </div>
          )
        }
      </Field>
    );
  };

  const pool = jobs.filter((j) => j.role !== "done");

  const match = dupe ? (course ? getDoc().courses : getDoc().jobads).find((x) => x.id === dupe) : undefined;
  if (match)
    return (
      <MergeView
        kind={kind}
        mode="new"
        saved={match as unknown as Record<string, unknown>}
        other={{ ...draft.fields, azav: draft.azav, covers: draft.covers }}
        onMerge={(c) => {
          mergeInto(kind, match.id, c, draft.goals);
          toast(tm("m_merged", { x: match.name }));
          closeSheet();
        }}
        onBoth={save}
        onCancel={() => setDupe(null)}
        cancelLabel={tm("m_back")}
      />
    );

  return (
    <>
      <SheetHead
        icon={course ? "book" : "bag"}
        /* a saved item: say what it is above its name; a new one: the title says it already */
        eyebrow={isNew ? undefined : t(`${P}edit`)}
        title={saved?.name || t(isNew ? `${P}new` : `${P}edit`)}
        focusHeading={!isNew}
      />
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <FieldGrid>
          {SHORT[kind].map(field)}
          <Field label={t("ce_status")}>
            {(p) => (
              <Select
                id={p.id}
                value={draft.status}
                onChange={(e) => setDraft((x) => ({ ...x, status: e.target.value as ItemStatus }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`st_${s}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FieldGrid>

        {pool.length > 0 && (
          <div role="group" aria-labelledby={forId} className="flex flex-col gap-2">
            <span id={forId} className="text-small font-extrabold">
              {t("ce_for")}
            </span>
            <Chips>
              {pool.map((j) => {
                const on = draft.goals.includes(j.id);
                return (
                  <ToggleChip
                    key={j.id}
                    pressed={on}
                    onClick={() => setDraft((x) => ({ ...x, goals: toggle(x.goals, j.id) }))}
                  >
                    {j.role === "goal" && <Icon name="flag" />}
                    {j.title}
                  </ToggleChip>
                );
              })}
            </Chips>
          </div>
        )}

        {course && (draft.goals.length > 0 || draft.covers.length > 0) && (
          <NeedCatalog>
            <CoverPicker
              goals={draft.goals}
              covers={draft.covers}
              onToggle={(v) => setDraft((x) => ({ ...x, covers: toggle(x.covers, v, skKey) }))}
            />
          </NeedCatalog>
        )}

        <Disclosure summary={t("ce_more")} className="border-t border-line pt-1">
          <FieldGrid className="pt-2">
            {MORE[kind].filter((k) => !LONG.includes(k)).map(field)}
            {course && (
              <Field label={t("ce_azav")}>
                {(p) => (
                  <Select
                    id={p.id}
                    value={draft.azav}
                    onChange={(e) => setDraft((x) => ({ ...x, azav: e.target.value as Azav }))}
                  >
                    <option value="">{t("ce_azav_unknown")}</option>
                    <option value="provider">{t("ce_azav_provider")}</option>
                    <option value="no">{t("ce_azav_no")}</option>
                  </Select>
                )}
              </Field>
            )}
            {MORE[kind].filter((k) => LONG.includes(k)).map(field)}
          </FieldGrid>
        </Disclosure>

        {/* the sheet's footer: it sticks to the bottom of the sheet while the form scrolls (the negative
            margins take it to the sheet's edges, matching SheetHost's padding) */}
        <div className="sticky -bottom-6 z-[1] -mx-4 -mt-2 flex flex-wrap items-center gap-2.5 border-t border-line bg-surface px-4 py-3 sm:-bottom-[26px] sm:-mx-5 sm:px-5">
          <Button type="submit" variant="primary" className="max-sm:flex-1">
            <Icon name="check" />
            {t("save")}
          </Button>
          {!isNew && (
            <span aria-live="polite" className="ml-auto">
              <DeleteButton label={t("delete")} onDelete={remove} />
            </span>
          )}
        </div>
      </form>
    </>
  );
}

/* ---------- which of the goals' skills a course covers ----------
   Neutral toggles (the selected look of every choice, with a check); "you have" only as a small tag. Skills
   still to learn come first. A filter field when the list is long. */
function CoverPicker({
  goals,
  covers,
  onToggle,
}: {
  goals: readonly string[];
  covers: readonly SkillRef[];
  onToggle: (x: SkillRef) => void;
}) {
  const t = useT(strings);
  const E = useEscoReady();
  const d = useDoc();
  const labelId = useId();
  const [q, setQ] = useState("");
  const tiles = new Map<string, { key: string; x: SkillRef; name: string; have: boolean }>();
  goals
    .map((g) => jobById(d, g))
    .forEach((j) => {
      if (j)
        jobTiles(d, E, j.occ, j).forEach(
          (tl) =>
            !tiles.has(tl.key) &&
            tiles.set(tl.key, { key: tl.key, x: tl.x, name: tl.name, have: tl.state === "have" }),
        );
    });
  covers.forEach((v) => {
    if (!tiles.has(skKey(v))) tiles.set(skKey(v), { key: skKey(v), x: v, name: skName(E, v), have: false });
  });
  if (!tiles.size) return null;
  const on = new Set(covers.map(skKey));
  const all = [...tiles.values()];
  const sorted = [...all.filter((x) => !x.have), ...all.filter((x) => x.have)];
  const nq = normTxt(q.trim());
  const shown = nq ? sorted.filter((x) => normTxt(x.name).includes(nq)) : sorted;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <span id={labelId} className="text-small font-extrabold">
          {t("ce_covers")}
        </span>
        <Hint>
          {t("ce_covers_p")}{" "}
          <span className="font-bold text-ink-2" aria-live="polite">
            {t("ce_covers_n", { n: on.size })}
          </span>
        </Hint>
      </div>
      {all.length > FILTER_FROM && (
        <Field label={t("ce_covers_filter")} srLabel>
          {(p) => (
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
              />
              <Input
                id={p.id}
                type="search"
                autoComplete="off"
                placeholder={t("ce_covers_filter")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-11"
              />
            </div>
          )}
        </Field>
      )}
      <div role="group" aria-labelledby={labelId}>
        {shown.length ? (
          <Chips>
            {shown.map((tl) => {
              const pressed = on.has(tl.key);
              return (
                <ToggleChip
                  key={tl.key}
                  pressed={pressed}
                  onClick={() => onToggle(tl.x)}
                  className="text-left"
                >
                  <span className="min-w-0 break-words hyphens-auto">{tl.name}</span>
                  {tl.have && (
                    <Tag tone="have" className="-mr-1.5 whitespace-nowrap">
                      <span className="sr-only">, </span>
                      {t("c_legend_have")}
                    </Tag>
                  )}
                </ToggleChip>
              );
            })}
          </Chips>
        ) : (
          <Hint>{t("ce_covers_none")}</Hint>
        )}
      </div>
    </div>
  );
}
