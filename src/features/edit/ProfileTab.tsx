import { update, useDoc } from "@/data/store";
import type { Profile } from "@/data/types";
import { GERMAN_LEVELS, HOURS, PC_LEVELS, PLACES, SITUATIONS } from "@/data/profileOptions";
import { profileFields } from "@/i18n/profileFields";
import { useT } from "@/i18n";
import { Field, FieldGrid, Panel, Select } from "@/ui";
import { CommitText } from "./fields";

type TextKey =
  "name" | "location" | "languages" | "contact" | "want" | "avoid" | "limits" | "hobbies" | "projects";
type ChoiceKey = "german" | "computer" | "situation" | "hours" | "place";
type Opt<K extends ChoiceKey> = Exclude<Profile[K], "">;

const set = <K extends TextKey | ChoiceKey>(k: K, v: Profile[K]) =>
  update((d) => {
    d.profile[k] = v;
  });

/** The profile fields: saved when the person leaves a field or picks a choice. */
export function ProfileTab() {
  const t = useT(profileFields);
  const P = useDoc((d) => d.profile);

  const text = (k: TextKey, label: string) => (
    <Field label={label}>
      {(p) => (
        <CommitText
          id={p.id}
          value={P[k]}
          onCommit={(v) => set(k, v)}
          autoComplete={k === "name" ? "name" : "off"}
        />
      )}
    </Field>
  );
  const area = (k: TextKey, label: string) => (
    <Field label={label} wide>
      {(p) => <CommitText multiline id={p.id} rows={2} value={P[k]} onCommit={(v) => set(k, v)} />}
    </Field>
  );
  /* a select over the allowed values of one field; the stored value is always one of them or "" */
  function choice<K extends ChoiceKey>(
    k: K,
    label: string,
    opts: readonly Opt<K>[],
    name: (o: Opt<K>) => string,
  ) {
    return (
      <Field label={label}>
        {(p) => (
          <Select
            id={p.id}
            value={P[k]}
            onChange={(e) => set(k, (opts.find((o) => o === e.target.value) ?? "") as Profile[K])}
          >
            <option value="">{t("choose")}</option>
            {opts.map((o) => (
              <option key={o} value={o}>
                {name(o)}
              </option>
            ))}
          </Select>
        )}
      </Field>
    );
  }

  return (
    <Panel className="p-5 sm:p-6">
      <FieldGrid className="gap-x-4 gap-y-5">
        {text("name", t("f_name"))}
        {text("location", t("f_location"))}
        {text("languages", t("f_languages"))}
        {text("contact", t("f_contact"))}
        {choice("german", t("f_german"), GERMAN_LEVELS, (o) => t(`g_${o}` as const))}
        {choice("computer", t("f_computer"), PC_LEVELS, (o) => t(`pc_${o}` as const))}
        {choice("situation", t("w_sit"), SITUATIONS, (o) => t(`w_sit_${o}` as const))}
        {choice("hours", t("w_hours"), HOURS, (o) => t(`w_hours_${o}` as const))}
        {choice("place", t("w_place"), PLACES, (o) => t(`w_place_${o}` as const))}
        {area("want", t("w_want"))}
        {area("avoid", t("w_avoid"))}
        {area("limits", t("w_limits"))}
        {area("hobbies", t("w_hobbies"))}
        {area("projects", t("w_projects"))}
      </FieldGrid>
    </Panel>
  );
}
