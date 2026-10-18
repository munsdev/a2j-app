import type { Job } from "@/data/types";
import { useEsco } from "@/app/catalog";
import { removeJob } from "@/data/doc";
import { update } from "@/data/store";
import { occLabel, searchOcc } from "@/domain/catalog";
import { useOccSearch } from "@/app/useCatalogSearch";
import { useT } from "@/i18n";
import { profileFields } from "@/i18n/profileFields";
import { Checkbox, Field, FieldGrid, Hint, Icon, IconButton, Input, Select, SuggestInput } from "@/ui";
import { strings } from "../strings";

/* One job in Your story: a job done (title, where, when, current) or a job thought about (title only).
   Typing a title matches it to the catalogue again; the "In the catalogue:" select corrects the match. */
const quiet = { quiet: true };
const editJob = (id: string, fn: (j: Job) => void) =>
  update((d) => {
    const j = d.jobs.find((x) => x.id === id);
    if (j) fn(j);
  }, quiet);

export function JobRow({ job, goal, autoFocus }: { job: Job; goal: boolean; autoFocus?: boolean }) {
  const t = useT(strings, profileFields);
  const E = useEsco();
  const title = job.title.trim();
  /* one search serves the suggestions under the field and the choices in the select */
  const hits = useOccSearch(E, title, 8);

  const setTitle = (v: string) =>
    editJob(job.id, (j) => {
      const changed = v.trim() !== j.title.trim();
      j.title = v;
      if (!changed) return;
      j.auto = true;
      j.occ = null;
      if (E && v.trim()) j.occ = searchOcc(E, v, 1)[0] ?? -1;
    });

  return (
    <div className="relative flex flex-col gap-3 rounded-card bg-surface py-3.5 pr-14 pl-3.5 shadow-card">
      <Field label={t(goal ? "w_targets" : "w_job_title")}>
        {(p) => (
          <SuggestInput
            id={p.id}
            value={job.title}
            onValueChange={setTitle}
            suggestions={title.length > 1 && E ? hits.map((o) => occLabel(E, o)) : []}
            placeholder={goal ? t("w_target_ph") : undefined}
            autoFocus={autoFocus}
          />
        )}
      </Field>
      {!goal && (
        <>
          <FieldGrid className="grid-cols-2 gap-2.5">
            <Field label={t("w_job_org")}>
              {(p) => (
                <Input
                  id={p.id}
                  value={job.org}
                  onChange={(e) => editJob(job.id, (j) => (j.org = e.target.value))}
                />
              )}
            </Field>
            <Field label={t("w_job_when")}>
              {(p) => (
                <Input
                  id={p.id}
                  value={job.when}
                  placeholder={t("w_job_when_ph")}
                  onChange={(e) => editJob(job.id, (j) => (j.when = e.target.value))}
                />
              )}
            </Field>
          </FieldGrid>
          <Checkbox
            label={t("w_job_current")}
            checked={!!job.current}
            onChange={(e) => editJob(job.id, (j) => (j.current = e.target.checked))}
          />
        </>
      )}
      {title && <MatchLine job={job} hits={hits} />}
      <IconButton
        aria-label={`${t("remove")}: ${job.title || t(goal ? "w_targets" : "w_job_title")}`}
        className="absolute top-2 right-2 text-ink-3 hover:text-no"
        onClick={() => update((d) => removeJob(d, job.id), quiet)}
      >
        <Icon name="trash" />
      </IconButton>
    </div>
  );
}

/** The catalogue match of a job, as a select to correct it. */
function MatchLine({ job, hits }: { job: Job; hits: number[] }) {
  const t = useT(strings, profileFields);
  const E = useEsco();
  const box = "flex flex-col gap-1 rounded-tile bg-surface-2 px-2.5 py-2";
  if (!E)
    return (
      <div className={box} role="status">
        <Hint>{t("w_match_wait")}</Hint>
      </div>
    );
  const sug = hits.slice(0, 6);
  if (job.occ != null && job.occ >= 0 && !sug.includes(job.occ)) sug.unshift(job.occ);
  if (!sug.length)
    return (
      <div className={box}>
        <Hint>{t("w_match_no")}</Hint>
      </div>
    );
  return (
    <div className={box}>
      <Field label={t("w_match")} className="[&>label]:font-bold [&>label]:text-ink-3">
        {(p) => (
          <Select
            id={p.id}
            className="min-h-11 py-2"
            value={job.occ ?? -1}
            onChange={(e) =>
              editJob(job.id, (j) => {
                j.occ = +e.target.value;
                j.auto = false;
              })
            }
          >
            <option value={-1}>{t("w_match_none")}</option>
            {sug.map((o) => (
              <option key={o} value={o}>
                {occLabel(E, o)}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </div>
  );
}
