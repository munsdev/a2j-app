import type { ReactNode } from "react";
import type { ItemStatus, Job } from "@/data/types";
import { useDoc } from "@/data/store";
import { useEsco } from "@/app/catalog";
import { jobTiles, skKey } from "@/domain/skills";
import { useT } from "@/i18n";
import { Button, Chip, Hint, Icon, RowButton, type ChipTone, type IconName } from "@/ui";
import { routeForJob } from "@/data/routes";
import { startRoute, putCourseOn } from "@/features/routes/actions";
import { strings as routeStrings } from "@/features/routes/strings";
import { strings } from "./strings";
import { openItem } from "./api";

/* CONTRACT (owned by the Courses/Prompts/Plan build): see ./api.ts
   The courses and job ads saved for a job, as rows that open the short form. */

const STATUS_TONE: Record<ItemStatus, ChipTone> = {
  interested: "plain",
  contacted: "plain",
  applied: "yes",
  interview: "yes",
  accepted: "yes",
  rejected: "no",
};

export function CourseList({ job }: { job: Job }) {
  const t = useT(strings);
  const tr = useT(routeStrings);
  const d = useDoc();
  const E = useEsco();
  const cs = d.courses.filter((c) => c.goals.includes(job.id));
  if (!cs.length) return <Hint>{t("d_courses_none")}</Hint>;
  const keys = new Set(jobTiles(d, E, job.occ, job).map((x) => x.key));
  /* the route to this job you are on (or its first): a course is used on it, or can be */
  const r = routeForJob(d, job.id);
  return (
    <ul className="flex flex-col gap-2">
      {cs.map((c) => {
        const n = c.covers.filter((v) => keys.has(skKey(v))).length;
        const st = c.status || "interested";
        const on = d.routes.filter((x) => x.job === job.id && x.course === c.id).map((x) => x.id);
        return (
          <Row
            key={c.id}
            icon="book"
            name={c.name}
            meta={[c.provider, c.start, c.length].filter(Boolean).join(" · ")}
            onOpen={() => openItem("course", c.id, job.id)}
            after={
              on.length ? null : r ? (
                <Button size="sm" variant="ghost" onClick={() => putCourseOn(r.id, c.id)}>
                  {tr("r_use", { x: r.id })}
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => startRoute(job.id, c.id)}>
                  {tr("r_try")}
                </Button>
              )
            }
          >
            {on.map((id) => (
              <Chip key={id} tone="course">
                {tr("r_in", { x: id })}
              </Chip>
            ))}
            {n > 0 && (
              <Chip tone="course">
                <Icon name="book" />
                {t("f_covers_n", { n })}
              </Chip>
            )}
            {c.azav === "provider" && <Chip tone="yes">{t("f_azav")}</Chip>}
            <Chip tone={STATUS_TONE[st]}>{t(`st_${st}`)}</Chip>
          </Row>
        );
      })}
    </ul>
  );
}

export function JobadList({ job }: { job: Job }) {
  const t = useT(strings);
  const ads = useDoc((d) => d.jobads).filter((a) => a.goals.includes(job.id));
  if (!ads.length) return <Hint>{t("d_ads_none")}</Hint>;
  return (
    <ul className="flex flex-col gap-2">
      {ads.map((a) => {
        const st = a.status || "interested";
        return (
          <Row
            key={a.id}
            icon="bag"
            name={a.name}
            meta={[a.org, a.place, a.deadline].filter(Boolean).join(" · ")}
            onOpen={() => openItem("jobad", a.id, job.id)}
          >
            <Chip tone={STATUS_TONE[st]}>{t(`st_${st}`)}</Chip>
          </Row>
        );
      })}
    </ul>
  );
}

function Row({
  icon,
  name,
  meta,
  onOpen,
  after,
  children,
}: {
  icon: IconName;
  name: string;
  meta: string;
  onOpen: () => void;
  /** an action under the row (a button cannot sit inside the row's own button) */
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col items-start gap-0.5">
      <RowButton icon={icon} title={name} detail={meta || undefined} onClick={onOpen}>
        {children}
      </RowButton>
      {after}
    </li>
  );
}
