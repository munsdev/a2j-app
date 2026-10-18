import type { ReactNode } from "react";
import type { Job } from "@/data/types";
import { jobById, mainGoal } from "@/data/doc";
import { useDoc } from "@/data/store";
import { useEscoReady } from "@/app/catalog";
import { go } from "@/app/router";
import { openSheet } from "@/app/sheet";
import { occIn } from "@/domain/catalog";
import { courseLink, jobLink } from "@/domain/skills";
import { openFinder } from "@/features/courses/api";
import { CourseList, JobadList } from "@/features/courses/lists";
import { useT } from "@/i18n";
import {
  ActionBar,
  Button,
  EmptyState,
  ExternalLink,
  Hint,
  Icon,
  IconButton,
  Page,
  Panel,
  PanelTitle,
  RowButton,
  RunHeader,
  SheetHead,
  type IconName,
} from "@/ui";
import { makeGoalAndOpen, makeMain, removeWithUndo } from "./actions";
import { Board } from "./Board";
import { JobCard } from "./JobCard";
import { Title } from "./Title";
import { cardKey, toggleFlip, useFlipped } from "./store";
import { strings } from "./strings";

/* =================== A SAVED JOB ===================
   Its card (sticky on computers), the one main action, its board when it is a goal, the courses and job ads
   saved for it, and searches on the Jobbörse and mein NOW. The menu holds the rest. */

export function JobPage({ id }: { id: string }) {
  const t = useT(strings);
  const d = useDoc();
  const job = jobById(d, id);
  if (!job)
    return (
      <Page>
        <EmptyState
          actions={
            <Button variant="primary" onClick={() => go("goals")}>
              {t("g_title")}
            </Button>
          }
        >
          {t("d_not_found")}
        </EmptyState>
      </Page>
    );
  const isMain = job.id === mainGoal(d)?.id;
  return (
    <Page width="wide">
      <RunHeader
        onBack={() => go("goals")}
        eyebrow={t("nav_goals")}
        end={
          <IconButton
            aria-label={t("d_more")}
            aria-haspopup="dialog"
            onClick={() => openSheet(<MoreSheet id={job.id} />, { label: job.title })}
            className="-mr-2.5"
          >
            <Icon name="more" />
          </IconButton>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] min-[1000px]:grid-cols-2 min-[1000px]:items-start min-[1000px]:gap-[22px]">
        {/* phones: the bar goes to the end and sticks to the bottom; computers: it sits under the card */}
        <div className="contents min-[1000px]:sticky min-[1000px]:top-[84px] min-[1000px]:flex min-[1000px]:flex-col">
          <JobCard occ={job.occ ?? -1} job={job} main />
          <ActionBar
            stretch
            className="order-last min-[1000px]:static min-[1000px]:bg-none min-[1000px]:pt-3.5 min-[1000px]:pb-0"
          >
            <Actions job={job} isMain={isMain} />
          </ActionBar>
        </div>
        <div className="flex min-w-0 flex-col gap-[18px]">
          {job.role === "goal" && (job.occ ?? -1) >= 0 && <GoalBoard job={job} />}
          <Panel>
            <PanelHead icon="book" title={t("d_courses")}>
              <Button size="sm" onClick={() => openFinder("course", job.id)}>
                <Icon name="search" />
                {t("d_find_course")}
              </Button>
            </PanelHead>
            <CourseList job={job} />
          </Panel>
          <Panel>
            <PanelHead icon="bag" title={t("d_ads")}>
              <Button size="sm" onClick={() => openFinder("jobad", job.id)}>
                <Icon name="search" />
                {t("d_find_ads")}
              </Button>
            </PanelHead>
            <JobadList job={job} />
          </Panel>
          <SearchLinks job={job} />
        </div>
      </div>
    </Page>
  );
}

function PanelHead({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <PanelTitle>
        <Icon name={icon} />
        {title}
      </PanelTitle>
      {children}
    </div>
  );
}

/** Turn the card, plus the one thing to do next with this job. */
function Actions({ job, isMain }: { job: Job; isMain: boolean }) {
  const t = useT(strings);
  const key = cardKey(job.occ ?? -1, job.id);
  const flipped = useFlipped(key);
  /* below 1000px the bar sticks to the bottom while the card may be scrolled away: bring it into view */
  const flip = () => {
    toggleFlip(key);
    const card = document.querySelector<HTMLElement>(`[data-card="${CSS.escape(key)}"]`);
    if (!card) return;
    const r = card.getBoundingClientRect();
    if (r.top >= 0 && r.top < window.innerHeight * 0.4) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <>
      <Button onClick={flip}>
        <Icon name="flip" />
        <span>{flipped ? t("c_front") : t("c_flip")}</span>
      </Button>
      {job.role !== "goal" ? (
        <Button variant="primary" onClick={() => makeGoalAndOpen(job.id)}>
          <Icon name="flag" />
          {t("d_make")}
        </Button>
      ) : isMain ? (
        <Button variant="primary" onClick={() => openFinder("course", job.id)}>
          <Icon name="book" />
          {t("d_find_course")}
        </Button>
      ) : (
        <Button variant="primary" onClick={() => makeMain(job.id)}>
          <Icon name="flag" />
          {t("d_make_main")}
        </Button>
      )}
    </>
  );
}

/** The goal's board, as a panel among the others on the job page. */
function GoalBoard({ job }: { job: Job }) {
  const t = useT(strings);
  return (
    <section
      aria-label={t("g_way") + " " + job.title}
      className="flex flex-col gap-4 rounded-panel bg-surface p-[18px] shadow-card"
    >
      <Board job={job} />
      <Hint>{t("b_tap")}</Hint>
    </section>
  );
}

/** Searches outside: German labels, also in the English interface, and the person's town. */
function SearchLinks({ job }: { job: Job }) {
  const t = useT(strings);
  const E = useEscoReady();
  const town = useDoc((d) => d.profile.location);
  const de = (job.occ ?? -1) >= 0 ? occIn(E, job.occ!, "de") : job.title;
  const link =
    "min-h-11 rounded-tile px-3.5 text-small font-extrabold text-ink-2 no-underline hover:bg-surface hover:text-ink";
  return (
    <div className="flex flex-wrap gap-2">
      <ExternalLink className={link} href={jobLink(de, town)}>
        {t("d_jobs_ba")}
      </ExternalLink>
      <ExternalLink className={link} href={courseLink(de)}>
        {t("d_courses_now")}
      </ExternalLink>
    </div>
  );
}

/** The job page menu: goal or main goal, find a course or job ads, remove (with Undo). */
function MoreSheet({ id }: { id: string }) {
  const t = useT(strings);
  const d = useDoc();
  const job = jobById(d, id);
  if (!job) return null;
  const isMain = job.id === mainGoal(d)?.id;
  return (
    <>
      <SheetHead
        icon={job.role === "goal" ? "flag" : job.role === "maybe" ? "up" : undefined}
        eyebrow={
          job.role === "goal"
            ? t(isMain ? "g_main" : "g_goal")
            : job.role === "maybe"
              ? t("g_short")
              : undefined
        }
        title={<Title text={job.title} split />}
      />
      <div className="flex flex-col gap-1.5">
        {job.role === "goal" && !isMain && (
          <RowButton icon="flag" title={t("d_make_main")} chevron={false} onClick={() => makeMain(job.id)} />
        )}
        {job.role !== "goal" && (
          <RowButton
            icon="flag"
            title={t("d_make")}
            chevron={false}
            onClick={() => makeGoalAndOpen(job.id)}
          />
        )}
        <RowButton icon="book" title={t("d_find_course")} onClick={() => openFinder("course", job.id)} />
        <RowButton icon="bag" title={t("d_find_ads")} onClick={() => openFinder("jobad", job.id)} />
        <RowButton
          icon="trash"
          danger
          chevron={false}
          title={t("d_remove")}
          onClick={() => removeWithUndo(job.id)}
        />
      </div>
    </>
  );
}
