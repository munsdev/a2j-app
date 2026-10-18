import type { ReactNode } from "react";
import type { ItemStatus, Job } from "@/data/types";
import { useDoc } from "@/data/store";
import { useEsco } from "@/app/catalog";
import { jobTiles, skKey } from "@/domain/skills";
import { useT } from "@/i18n";
import { Chip, Hint, Icon, RowButton, type ChipTone, type IconName } from "@/ui";
import { strings } from "./strings";
import { openItem } from "./api";

/* CONTRACT (owned by the Courses/Prompts/Plan build): see ./api.ts
   The courses and job ads saved for a job, as rows that open the short form. */

const STATUS_TONE: Record<ItemStatus, ChipTone> = {
  interested: "plain",
  contacted: "plain",
  applied: "yes",
  accepted: "yes",
  rejected: "no",
};

export function CourseList({ job }: { job: Job }) {
  const t = useT(strings);
  const d = useDoc();
  const E = useEsco();
  const cs = d.courses.filter((c) => c.goals.includes(job.id));
  if (!cs.length) return <Hint>{t("d_courses_none")}</Hint>;
  const keys = new Set(jobTiles(d, E, job.occ, job).map((x) => x.key));
  return (
    <ul className="flex flex-col gap-2">
      {cs.map((c) => {
        const n = c.covers.filter((v) => keys.has(skKey(v))).length;
        const st = c.status || "interested";
        return (
          <Row
            key={c.id}
            icon="book"
            name={c.name}
            meta={[c.provider, c.start, c.length].filter(Boolean).join(" · ")}
            onOpen={() => openItem("course", c.id, job.id)}
          >
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
  children,
}: {
  icon: IconName;
  name: string;
  meta: string;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <RowButton icon={icon} title={name} detail={meta || undefined} onClick={onOpen}>
        {children}
      </RowButton>
    </li>
  );
}
