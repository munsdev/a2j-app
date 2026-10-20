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
import { Button, Choice, Field, Hint, Icon, Panel, PanelTitle, Select } from "@/ui";
import { CommitText, RowDelete } from "./fields";
import { editStrings } from "./strings";

/** Past jobs belong to the profile; goals and the shortlist are the jobs you want. Each list keeps its kinds. */
const ROLES = { past: ["done"], want: ["goal", "maybe"] } as const satisfies Record<
  string,
  readonly JobRole[]
>;
type Kind = keyof typeof ROLES;

/** The jobs you want: goals, then the shortlist. */
export function JobsTab() {
  const t = useT(editStrings);
  return (
    <>
      <JobList kind="want" roles={["goal"]} title={t("e_goals_h")} add={false} />
      <JobList kind="want" roles={["maybe"]} title={t("e_short_h")} add />
    </>
  );
}

/** Your jobs so far: part of the profile (Edit my data, Profile). */
export function PastJobs() {
  const t = useT(editStrings);
  return <JobList kind="past" roles={["done"]} title={t("e_past_h")} add />;
}

function JobList({
  kind,
  roles,
  title,
  add,
}: {
  kind: Kind;
  roles: readonly JobRole[];
  title: string;
  /** with a button to add one (a new job you want goes on the shortlist) */
  add: boolean;
}) {
  const t = useT(editStrings, profileFields);
  const all = useDoc((d) => d.jobs);
  const jobs = all.filter((j) => roles.includes(j.role));
  const mainId = useDoc((d) => mainGoal(d)?.id ?? null);
  const [added, setAdded] = useState<string | null>(null);
  const hid = `edit-jobs-${roles.join("-")}`;
  return (
    <Panel aria-labelledby={hid} className="gap-4 p-2.5 sm:p-5">
      <PanelTitle id={hid} className="px-1">
        {title}
      </PanelTitle>
      {jobs.length ? (
        <ul className="flex flex-col gap-3">
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} kind={kind} main={j.id === mainId} focus={j.id === added} />
          ))}
        </ul>
      ) : (
        <Hint className="px-1">{t("e_none")}</Hint>
      )}
      {add && (
        <Button
          className="self-start"
          onClick={() => {
            let id = "";
            update((d) => void (id = addJob(d, { role: kind === "past" ? "done" : "maybe", title: "" }).id));
            setAdded(id);
          }}
        >
          <Icon name="plus" />
          {t(kind === "past" ? "e_add_past" : "e_add_job")}
        </Button>
      )}
    </Panel>
  );
}

function JobRow({ job: j, kind, main, focus }: { job: Job; kind: Kind; main: boolean; focus: boolean }) {
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
        {kind === "want" && (
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
                {ROLES.want.map((r) => (
                  <option key={r} value={r} disabled={r === "goal" && j.role !== "goal" && full}>
                    {t(`e_role_${r}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
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
