import { useState, type FormEvent, type Ref } from "react";
import type { Doc, JobRole, Profile } from "@/data/types";
import { useLoadCatalog } from "@/app/catalog";
import { addJob, jobsIn } from "@/data/doc";
import { update, useDoc } from "@/data/store";
import { useT } from "@/i18n";
import { profileFields } from "@/i18n/profileFields";
import { ActionBar, Button, Choice, Field, FieldGrid, Icon, Input, Lede, Select, Textarea } from "@/ui";
import { GERMAN_LEVELS, HOURS, PC_LEVELS, PLACES, SITUATIONS } from "@/data/profileOptions";
import { STORY, type StoryStep } from "../constants";
import { cleanJobs } from "../logic";
import { strings } from "../strings";
import { useRunBack, useStepFocus } from "./hooks";
import { JobRow } from "./JobRow";
import { BackButton, PauseButton, RunFrame, StepHeading, StepIntro } from "./RunFrame";

/* Part 5: five short steps of a form. Everything is saved as it is typed (quietly); Done closes the part,
   drops empty job rows and makes sure there is a main goal. */
type TextKey =
  "name" | "location" | "languages" | "contact" | "want" | "avoid" | "limits" | "hobbies" | "projects";
const TEXT_KEYS: readonly TextKey[] = [
  "name",
  "location",
  "languages",
  "contact",
  "want",
  "avoid",
  "limits",
  "hobbies",
  "projects",
];
const quiet = { quiet: true };
const setProfile = <K extends keyof Profile>(k: K, v: Profile[K]) =>
  update((d) => void (d.profile[k] = v), quiet);

/** Trim what was typed, as the previous app did when it read the form. */
function tidy(d: Doc) {
  TEXT_KEYS.forEach((k) => (d.profile[k] = d.profile[k].trim()));
  d.jobs.forEach((j) => {
    j.title = j.title.trim();
    j.org = j.org.trim();
    j.when = j.when.trim();
  });
}
/** The jobs and want steps always show at least one row to type into. */
const ROW_FOR: Partial<Record<StoryStep, JobRole>> = { jobs: "done", want: "goal" };

export function StoryRun({ onFinish }: { onFinish: (recipe: (d: Doc) => void) => void }) {
  const t = useT(strings, profileFields);
  const [pos, setPos] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  const step = STORY[pos];
  const last = pos === STORY.length - 1;
  const heading = useStepFocus<HTMLHeadingElement>(pos);
  useLoadCatalog(step === "jobs" || step === "want");

  const goStep = (n: number) => {
    const role = ROW_FOR[STORY[n]];
    update((d) => {
      tidy(d);
      if (role && !jobsIn(d, role).length) addJob(d, { role });
    }, quiet);
    setFocusId(null);
    setPos(n);
    window.scrollTo(0, 0);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (last)
      onFinish((d) => {
        tidy(d);
        cleanJobs(d);
      });
    else goStep(pos + 1);
  };
  const back = pos ? () => goStep(pos - 1) : null;
  useRunBack(back);

  return (
    <RunFrame part="story" step={[pos + 1, STORY.length]}>
      <form noValidate onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <div key={step} className="flex animate-fade-in flex-col gap-4">
          {step === "you" && (
            <>
              <Head heading={heading} title={t("w_you_h")} lede={t("w_you_p")} />
              <FieldGrid>
                <TextField k="name" label={t("f_name")} autoComplete="given-name" />
                <TextField k="location" label={t("f_location")} placeholder={t("w_location_ph")} />
                <TextField k="languages" label={t("f_languages")} placeholder={t("w_languages_ph")} />
                <TextField k="contact" label={t("f_contact")} autoComplete="email" />
                <ChoiceField
                  k="german"
                  label={t("f_german")}
                  options={GERMAN_LEVELS}
                  text={(o) => t(`g_${o}`)}
                />
                <ChoiceField
                  k="computer"
                  label={t("f_computer")}
                  options={PC_LEVELS}
                  text={(o) => t(`pc_${o}`)}
                />
              </FieldGrid>
            </>
          )}
          {step === "now" && (
            <>
              <Head heading={heading} title={t("w_now_h")} />
              <Situation />
            </>
          )}
          {step === "jobs" && (
            <>
              <Head heading={heading} title={t("w_jobs_h")} lede={t("w_jobs_p")} />
              <JobRows role="done" focusId={focusId} onAdd={setFocusId} addLabel={t("w_job_add")} />
            </>
          )}
          {step === "want" && (
            <>
              <Head heading={heading} title={t("w_want_h")} lede={t("w_targets_p")} />
              <JobRows role="goal" focusId={focusId} onAdd={setFocusId} addLabel={t("w_target_add")} />
              <FieldGrid className="mt-2">
                <TextField k="want" label={t("w_want")} area />
                <TextField k="avoid" label={t("w_avoid")} area />
                <ChoiceField k="hours" label={t("w_hours")} options={HOURS} text={(o) => t(`w_hours_${o}`)} />
                <ChoiceField
                  k="place"
                  label={t("w_place")}
                  options={PLACES}
                  text={(o) => t(`w_place_${o}`)}
                />
                <TextField k="limits" label={t("w_limits")} hint={t("w_limits_h")} area />
              </FieldGrid>
            </>
          )}
          {step === "more" && (
            <>
              <Head heading={heading} title={t("w_more_h")} lede={t("w_more_p")} />
              <FieldGrid>
                <TextField k="hobbies" label={t("w_hobbies")} hint={t("w_hobbies_h")} area />
                <TextField k="projects" label={t("w_projects")} area />
              </FieldGrid>
            </>
          )}
        </div>
        <ActionBar>
          <BackButton onClick={back ?? undefined} disabled={!back} />
          <PauseButton />
          <Button type="submit" variant="primary">
            {t(last ? "done" : "next")}
            <Icon name={last ? "check" : "arrow"} />
          </Button>
        </ActionBar>
      </form>
    </RunFrame>
  );
}

function Head({ heading, title, lede }: { heading: Ref<HTMLHeadingElement>; title: string; lede?: string }) {
  return (
    <StepIntro>
      <StepHeading ref={heading}>{title}</StepHeading>
      {lede && <Lede>{lede}</Lede>}
    </StepIntro>
  );
}

function TextField({
  k,
  label,
  hint,
  area,
  placeholder,
  autoComplete,
}: {
  k: TextKey;
  label: string;
  hint?: string;
  area?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const value = useDoc((d) => d.profile[k]);
  return (
    <Field label={label} hint={hint} wide={area}>
      {(p) =>
        area ? (
          <Textarea
            id={p.id}
            aria-describedby={p.hintId}
            rows={3}
            value={value}
            onChange={(e) => setProfile(k, e.target.value)}
          />
        ) : (
          <Input
            id={p.id}
            value={value}
            placeholder={placeholder}
            autoComplete={autoComplete ?? "off"}
            onChange={(e) => setProfile(k, e.target.value)}
          />
        )
      }
    </Field>
  );
}

type ChoiceKey = "german" | "computer" | "hours" | "place";
function ChoiceField<K extends ChoiceKey>({
  k,
  label,
  options,
  text,
}: {
  k: K;
  label: string;
  options: readonly Exclude<Profile[K], "">[];
  text: (o: Exclude<Profile[K], "">) => string;
}) {
  const t = useT(strings, profileFields);
  const value = useDoc((d) => d.profile[k]);
  return (
    <Field label={label}>
      {(p) => (
        <Select id={p.id} value={value} onChange={(e) => setProfile(k, e.target.value as Profile[K])}>
          <option value="">{t("choose")}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {text(o)}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function Situation() {
  const t = useT(strings, profileFields);
  const value = useDoc((d) => d.profile.situation);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-small font-extrabold">{t("w_sit")}</legend>
      {SITUATIONS.map((o) => (
        <Choice
          key={o}
          name="w_sit"
          value={o}
          checked={value === o}
          onChange={() => setProfile("situation", o)}
          label={t(`w_sit_${o}`)}
        />
      ))}
    </fieldset>
  );
}

function JobRows({
  role,
  focusId,
  onAdd,
  addLabel,
}: {
  role: JobRole;
  focusId: string | null;
  onAdd: (id: string) => void;
  addLabel: string;
}) {
  const jobs = useDoc((d) => d.jobs);
  const rows = jobs.filter((j) => j.role === role);
  return (
    <>
      <div className="flex flex-col gap-3">
        {rows.map((j) => (
          <JobRow key={j.id} job={j} goal={role === "goal"} autoFocus={j.id === focusId} />
        ))}
      </div>
      <Button
        className="self-start"
        onClick={() => {
          let id = "";
          update((d) => void (id = addJob(d, { role }).id), quiet);
          onAdd(id);
        }}
      >
        <Icon name="plus" />
        {addLabel}
      </Button>
    </>
  );
}
