import type { SkillRef } from "@/data/types";
import { update, useDoc } from "@/data/store";
import { level, setLevel, skKey } from "@/domain/skills";
import { openSkill } from "@/features/goals/openSkill";
import { strings as goalStrings } from "@/features/goals/strings";
import { useT } from "@/i18n";
import { Checkbox, LevelPicker, LinkButton } from "@/ui";
import { toggleCovers } from "./actions";
import { strings } from "./strings";

/* One skill of a route: how well you can do it (saved as you pick, the same on every route) and whether the
   route's course covers it, side by side, so neither is set by accident. On the board's line (the opened stop)
   and in a sheet from the compare quilt. */

export function SkillChoice({
  x,
  name,
  courseId,
  occ,
  jobId,
}: {
  x: SkillRef;
  name: string;
  courseId: string | null;
  occ: number | null;
  jobId: string | null;
}) {
  const t = useT(goalStrings);
  const tr = useT(strings);
  const rated = useDoc((d) => level(d, x));
  const course = useDoc((d) => (courseId ? (d.courses.find((c) => c.id === courseId) ?? null) : null));
  const covered = !!course?.covers.some((v) => skKey(v) === skKey(x));
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-small font-extrabold" aria-hidden="true">
          {t("k_level")}
        </p>
        <LevelPicker
          size="sm"
          label={t("k_level")}
          value={rated}
          onChange={(n) => update((dr) => setLevel(dr, x, n))}
        />
      </div>
      {course ? (
        <Checkbox
          className="text-small"
          label={tr("r_covers_this", { c: course.name })}
          checked={covered}
          onChange={() => toggleCovers(course.id, x, name)}
        />
      ) : (
        <p className="text-small text-ink-3">{tr("r_no_course")}</p>
      )}
      <LinkButton className="self-start text-small" onClick={() => openSkill(x, occ, jobId)}>
        {t("b_skill_more")}
      </LinkButton>
    </>
  );
}
