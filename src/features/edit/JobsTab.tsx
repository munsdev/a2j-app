import { useState } from "react";
import { useEscoReady } from "@/app/catalog";
import { toastUndo } from "@/app/toast";
import { update, useDoc } from "@/data/store";
import { addJob, mainGoal, removeJob } from "@/data/doc";
import { MAX_ROUTES, addRoute, switchToJob } from "@/data/routes";
import type { Job, JobRole } from "@/data/types";
import { occLabel } from "@/domain/catalog";
import { useOccSearch } from "@/app/useCatalogSearch";
import { matchJobs } from "@/domain/skills";
import { useT } from "@/i18n";
import { profileFields } from "@/i18n/profileFields";
import { Button, Choice, Field, Hint, Icon, Panel, Select } from "@/ui";
import { CommitText, RowDelete } from "./fields";
import { editStrings } from "./strings";

const ROLES: readonly JobRole[] = ["done", "goal", "maybe"];

/** Every job: done before, goals and the shortlist, with the catalogue match. */
export function JobsTab() {
  const t = useT(editStrings, profileFields);
  const jobs = useDoc((d) => d.jobs);
  const mainId = useDoc((d) => mainGoal(d)?.id ?? null);
  const [added, setAdded] = useState<string | null>(null);
  return (
    <Panel className="gap-4 p-2.5 sm:p-5">
      {jobs.length ? (
        <ul className="flex flex-col gap-3">
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} main={j.id === mainId} focus={j.id === added} />
          ))}
        </ul>
      ) : (
        <Hint className="px-1">{t("e_none")}</Hint>
      )}
      <Button
        className="self-start"
        onClick={() => {
          let id = "";
          update((d) => void (id = addJob(d, { role: "maybe", title: "" }).id));
          setAdded(id);
        }}
      >
        <Icon name="plus" />
        {t("e_add_job")}
      </Button>
    </Panel>
  );
}

function JobRow({ job: j, main, focus }: { job: Job; main: boolean; focus: boolean }) {
  const t = useT(editStrings, profileFields);
  const E = useEscoReady();
  const hits = useOccSearch(E, j.title, 6);
  const full = useDoc((d) => d.routes.length >= MAX_ROUTES);
  const sug = j.occ != null && j.occ >= 0 && !hits.includes(j.occ) ? [j.occ, ...hits] : hits;
  const edit = (fn: (x: Job) => void) =>
    update((d) => {
      const x = d.jobs.find((y) => y.id === j.id);
      if (x) fn(x);
    });

  return (
    <li className="rounded-card bg-surface-2 p-3.5 sm:p-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-x-3 gap-y-3.5">
        <Field label={t("w_job_title")}>
          {(p) => (
            <CommitText
              id={p.id}
              value={j.title}
              autoFocus={focus}
              onCommit={(v) =>
                update((d) => {
                  const x = d.jobs.find((y) => y.id === j.id);
                  if (!x) return;
                  x.title = v;
                  x.occ = null;
                  matchJobs(d, E);
                })
              }
            />
          )}
        </Field>
        <Field label={t("e_role")}>
          {(p) => (
            <Select
              id={p.id}
              value={j.role}
              onChange={(e) => {
                const role = e.target.value as JobRole;
                update((d) => {
                  const x = d.jobs.find((y) => y.id === j.id);
                  if (!x) return;
                  /* a goal is a job with a route: making one starts a route (while there is room) */
                  if (role === "goal") addRoute(d, x.id);
                  else x.role = role;
                });
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r} disabled={r === "goal" && j.role !== "goal" && full}>
                  {t(`e_role_${r}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("e_cat")} wide>
          {(p) => (
            <Select
              id={p.id}
              value={String(j.occ ?? -1)}
              onChange={(e) =>
                edit((x) => {
                  x.occ = +e.target.value;
                  x.auto = false;
                })
              }
            >
              <option value="-1">{t("w_match_none")}</option>
              {sug.map((o) => (
                <option key={o} value={o}>
                  {occLabel(E, o)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {j.role === "done" && (
          <>
            <Field label={t("w_job_when")}>
              {(p) => (
                <CommitText id={p.id} value={j.when} onCommit={(v) => edit((x) => void (x.when = v))} />
              )}
            </Field>
            <Field label={t("w_job_org")}>
              {(p) => <CommitText id={p.id} value={j.org} onCommit={(v) => edit((x) => void (x.org = v))} />}
            </Field>
          </>
        )}
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-3">
        {j.role === "goal" ? (
          <Choice
            name="edit-main-goal"
            label={t("e_main")}
            checked={main}
            onChange={() => update((d) => void switchToJob(d, j.id))}
            className="min-h-11 py-2.5"
          />
        ) : (
          <span />
        )}
        <RowDelete
          label={j.title ? `${t("delete")}: ${j.title}` : t("delete")}
          onDelete={() => {
            update((d) => removeJob(d, j.id));
            toastUndo(t("t_removed"));
          }}
        />
      </div>
    </li>
  );
}
