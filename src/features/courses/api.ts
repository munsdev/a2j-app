import { createElement } from "react";
import type { SkillRef } from "@/data/types";
import { getDoc } from "@/data/store";
import { openSheet } from "@/app/sheet";
import { resetPrompt } from "@/app/prompts";
import { useSettings } from "@/app/settings";
import { makeT } from "@/i18n";
import { strings } from "./strings";
import { Finder } from "./Finder";
import { ItemForm } from "./ItemForm";
import type { ItemKind } from "./types";

/* CONTRACT (owned by the Courses/Prompts/Plan build). Used by Goals (job page, skill sheet, board) and Edit.
   openFinder(kind, jobId, skill?): the "Find a course" / "Find job ads" sheet for a job, optionally for one skill.
   openItem(kind, id, jobId?, skill?): the short form to add (id = null) or edit a course or job ad; a new course
   opened for a skill starts with that skill ticked as covered.
   The saved items for a job, as rows that open openItem: <CourseList job /> and <JobadList job /> in ./lists. */
export type { ItemKind } from "./types";

const t = () => makeT(useSettings.getState().lang, strings);

export function openFinder(kind: ItemKind, jobId: string | null, skill?: SkillRef | null): void {
  /* a new search starts from the generated texts again */
  resetPrompt("fwords");
  resetPrompt("fai");
  openSheet(createElement(Finder, { kind, job: jobId, skill: skill ?? null }), {
    wide: true,
    label: t()(kind === "course" ? "f_title_course" : "f_title_jobad"),
  });
}

export function openItem(
  kind: ItemKind,
  id: string | null,
  jobId?: string | null,
  skill?: SkillRef | null,
): void {
  const d = getDoc();
  const list = kind === "course" ? d.courses : d.jobads;
  const ex = id ? list.find((x) => x.id === id) : undefined;
  const P = kind === "course" ? "ce_" : "ae_";
  openSheet(
    createElement(ItemForm, {
      kind,
      id: ex?.id ?? null,
      jobId: jobId ?? null,
      skill: skill ?? null,
      key: kind + (ex?.id ?? "new"),
    }),
    {
      label: ex?.name || t()(ex ? `${P}edit` : `${P}new`),
    },
  );
}
