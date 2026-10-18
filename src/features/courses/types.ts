import type { SkillRef } from "@/data/types";

export type ItemKind = "course" | "jobad";

/** What the finder is looking for: courses or job ads, for a job, optionally for one skill. */
export interface FinderSpec {
  kind: ItemKind;
  job: string | null;
  skill: SkillRef | null;
  /** a page the person already found (optional): the AI prompt then asks to read it */
  url: string;
}
