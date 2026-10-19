import { update, useDoc } from "@/data/store";
import { jobById, jobForOcc } from "@/data/doc";
import type { SkillRef } from "@/data/types";
import { coursesCovering, level, setLevel, skKey, skName, skillSources } from "@/domain/skills";
import { courseForJob } from "@/data/routes";
import { toggleCovers } from "@/features/routes/actions";
import { strings as routeStrings } from "@/features/routes/strings";
import { isKnowledge } from "@/domain/catalog";
import { useEscoReady } from "@/app/catalog";
import { openFinder, openItem } from "@/features/courses/api";
import { useT } from "@/i18n";
import { Button, Icon, LevelPicker, RowButton, SheetHead } from "@/ui";
import { strings } from "./strings";

/* A skill: where it comes from, how well you can do it, what covers it. Opened from tiles and board squares. */
export function SkillSheet({ x, occ, jobId }: { x: SkillRef; occ: number | null; jobId: string | null }) {
  const t = useT(strings);
  const tr = useT(routeStrings);
  const E = useEscoReady();
  const d = useDoc();
  const isNum = typeof x === "number";
  const name = skName(E, x);
  const rated = level(d, x);
  const l = rated ?? 0;
  const src = isNum ? skillSources(d, E, x) : [];
  const cs = coursesCovering(d, x, jobId);
  const job = jobId ? jobById(d, jobId) : occ != null && occ >= 0 ? jobForOcc(d, occ) : null;
  const knowledge = isNum && isKnowledge(E, x);
  /* the course of the job's route, when it does not cover this yet: say it does */
  const rc = job ? courseForJob(d, job.id) : null;
  const missed = !!rc && !rc.covers.some((v) => skKey(v) === skKey(x));
  return (
    <>
      <SheetHead
        icon={knowledge ? "book" : "spark"}
        eyebrow={knowledge ? t("sk_knowledge") : t("sk_skill")}
        title={name}
        sub={src.length > 0 ? t("k_from", { x: src.join(", ") }) : !isNum ? t("k_own") : undefined}
      />
      <div className="flex flex-col gap-2">
        <p className="text-label font-extrabold" aria-hidden="true">
          {t("k_level")}
        </p>
        <LevelPicker
          label={t("k_level")}
          value={rated}
          onChange={(n) => update((dr) => setLevel(dr, x, n))}
          hint
        />
      </div>
      {cs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-label font-extrabold">{t("k_courses")}</p>
          <ul className="flex flex-col gap-1.5">
            {cs.map((c) => (
              <li key={c.id}>
                <RowButton
                  icon="book"
                  title={c.name}
                  detail={c.provider || undefined}
                  onClick={() => openItem("course", c.id, job?.id ?? null)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* the route's course: say it covers this after all, or that it does not */}
      {rc && (
        <div className="flex flex-wrap gap-2.5">
          <Button variant={missed ? "soft" : "ghost"} onClick={() => toggleCovers(rc.id, x, name)}>
            <Icon name="book" />
            {tr(missed ? "r_covers_this" : "r_covers_not", { c: rc.name })}
          </Button>
        </div>
      )}
      {l < 1 && job && (
        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary" onClick={() => openFinder("course", job.id, x)}>
            <Icon name="search" />
            {t("k_find")}
          </Button>
        </div>
      )}
    </>
  );
}
