import type { SkillRef } from "@/data/types";
import { openSheet } from "@/app/sheet";
import { SheetHead } from "@/ui";
import { SkillChoice } from "./SkillChoice";

/** The skill of a route in a sheet: from a cell of the compare quilt. */
export function openSkillChoice(o: {
  x: SkillRef;
  name: string;
  courseId: string | null;
  occ: number | null;
  jobId: string | null;
  /** "Route A · Fraud investigator" */
  eyebrow: string;
}): void {
  openSheet(
    <>
      <SheetHead eyebrow={o.eyebrow} title={o.name} />
      <div className="flex flex-col gap-4">
        <SkillChoice {...o} />
      </div>
    </>,
    { label: o.name },
  );
}
