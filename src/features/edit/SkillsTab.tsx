import { useState, type ReactNode } from "react";
import { useEscoReady } from "@/app/catalog";
import { toast, toastUndo } from "@/app/toast";
import { update, useDoc } from "@/data/store";
import { normTxt, skLabel } from "@/domain/catalog";
import { useSkillSearch } from "@/app/useCatalogSearch";
import { addOwnSkill, setLevel } from "@/domain/skills";
import { useT } from "@/i18n";
import { Button, Field, Hint, Icon, Input, Panel, PanelTitle, Select, SuggestInput } from "@/ui";
import { RowDelete } from "./fields";
import { editStrings } from "./strings";

const LEVELS = [0, 1, 2, 3, 4, 5] as const;

/** Rated catalogue skills and skills in the person's own words: change the level, delete, add. A filter
 *  above both lists finds a skill by name (there can be fifty). */
export function SkillsTab() {
  const t = useT(editStrings);
  const E = useEscoReady();
  const ratedMap = useDoc((d) => d.esco.rated);
  const own = useDoc((d) => d.esco.own);
  const [q, setQ] = useState("");
  const query = normTxt(q);
  const hit = (...names: (string | undefined)[]) => !query || names.some((n) => normTxt(n).includes(query));

  const rated = Object.entries(ratedMap)
    .map(([x, l]) => ({ x: +x, l, name: skLabel(E, +x) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  /* keep each own skill's place in the list: deleting splices by it */
  const owned = own.map((o, i) => ({ ...o, i, linked: o.esco != null ? skLabel(E, o.esco) : undefined }));
  const ratedShown = rated.filter((r) => hit(r.name));
  const ownShown = owned.filter((o) => hit(o.name, o.linked));

  /* the empty line of a list: nothing there yet, or nothing that matches the filter */
  const none = (all: number) =>
    all && query ? (
      <Hint role="status" className="px-1 py-2">
        {t("e_filter_none")}
      </Hint>
    ) : (
      <Hint className="px-1">{t("e_none")}</Hint>
    );

  return (
    <>
      {rated.length + own.length > 0 && (
        <Field label={t("e_filter")}>
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
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-11"
              />
            </div>
          )}
        </Field>
      )}

      <Panel aria-labelledby="edit-rated-h" className="gap-1 p-3 sm:p-5">
        <PanelTitle id="edit-rated-h" className="px-1 pb-1">
          {t("e_rated")}
        </PanelTitle>
        {ratedShown.length ? (
          <ul className="flex flex-col">
            {ratedShown.map((r) => (
              <SkillRow
                key={r.x}
                name={r.name}
                level={r.l}
                onLevel={(n) => update((d) => setLevel(d, r.x, n))}
                onDelete={() => {
                  update((d) => void delete d.esco.rated[r.x]);
                  toastUndo(t("t_removed"));
                }}
              />
            ))}
          </ul>
        ) : (
          none(rated.length)
        )}
      </Panel>

      <Panel aria-labelledby="edit-own-h" className="gap-1 p-3 sm:p-5">
        <PanelTitle id="edit-own-h" className="px-1 pb-1">
          {t("e_own")}
        </PanelTitle>
        {ownShown.length ? (
          <ul className="flex flex-col">
            {ownShown.map((o) => (
              <SkillRow
                key={o.name + o.i}
                name={o.name}
                linked={o.linked}
                level={o.level || 0}
                onLevel={(n) => update((d) => setLevel(d, o.name, n))}
                onDelete={() => {
                  update((d) => void d.esco.own.splice(o.i, 1));
                  toastUndo(t("t_removed"));
                }}
              />
            ))}
          </ul>
        ) : (
          none(own.length)
        )}
        <AddSkill />
      </Panel>
    </>
  );
}

/** One skill as a dense row: the name, its level, delete. On phones the level takes a second line. */
function SkillRow({
  name,
  linked,
  level,
  onLevel,
  onDelete,
}: {
  name: string;
  linked?: string;
  level: number;
  onLevel: (n: number) => void;
  onDelete: () => void;
}) {
  const t = useT(editStrings);
  let label: ReactNode = name;
  if (linked)
    label = (
      <>
        {name} <span className="text-small font-semibold text-ink-3">({linked})</span>
      </>
    );
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 border-b border-line px-1 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-x-3">
      <span className="min-w-0 font-bold break-words">{label}</span>
      <Select
        aria-label={`${t("k_level")} ${name}`}
        value={level}
        onChange={(e) => onLevel(+e.target.value)}
        className="min-h-11 w-full py-1.5 text-small max-sm:col-span-full max-sm:row-start-2 sm:w-auto"
      >
        {LEVELS.map((n) => (
          <option key={n} value={n}>
            {n} · {t(`lv${n}`)}
          </option>
        ))}
      </Select>
      {/* phones: delete sits next to the name, so its "Tap again" state never squeezes the level */}
      <RowDelete
        label={`${t("delete")}: ${name}`}
        onDelete={onDelete}
        className="max-sm:col-start-2 max-sm:row-start-1"
      />
    </li>
  );
}

function AddSkill() {
  const t = useT(editStrings);
  const E = useEscoReady();
  const [text, setText] = useState("");
  const suggestions = useSkillSearch(E, text, 8).map((i) => skLabel(E, i));
  return (
    <form
      className="mt-3 flex flex-wrap items-start gap-2.5 border-t border-line pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const v = text.trim();
        if (!v) return;
        update((d) => void addOwnSkill(d, E, v));
        toast(t("t_added", { x: v }));
        setText("");
      }}
    >
      <label htmlFor="edit-add-skill" className="sr-only">
        {t("e_add_skill")}
      </label>
      <div className="flex min-w-[min(100%,240px)] flex-1">
        <SuggestInput
          id="edit-add-skill"
          value={text}
          onValueChange={setText}
          suggestions={suggestions}
          placeholder={t("sk_add_ph")}
        />
      </div>
      <Button type="submit">
        <Icon name="plus" />
        {t("e_add_skill")}
      </Button>
    </form>
  );
}
