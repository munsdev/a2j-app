import { useMemo, useState, type FormEvent } from "react";
import type { Job } from "@/data/types";
import { addJob, jobForOcc, jobsIn, mainGoal } from "@/data/doc";
import { getDoc, update, useDoc } from "@/data/store";
import { useEscoReady } from "@/app/catalog";
import { go } from "@/app/router";
import { toast } from "@/app/toast";
import { normTxt, occLabel, searchOcc } from "@/domain/catalog";
import { useOccSearch } from "@/app/useCatalogSearch";
import { canRank, setVote } from "@/domain/rank";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Hint, Icon, Page, PageHeader, Panel, PanelTitle, SuggestInput, Tag } from "@/ui";
import { BoardCard } from "./BoardCard";
import { jobMatch } from "@/data/dupes";
import { strings as mergeStrings } from "@/features/merge/strings";
import { OtherRoutes } from "@/features/routes/OtherRoutes";
import { FitBadge } from "./Fit";
import { useFitText, useMatch } from "./useFit";
import { Title } from "./Title";
import { strings } from "./strings";

/* Goals: the main goal's board, other goals, the shortlist, job ideas, and a job you already have in mind.
   Two columns on computers. */
export function Overview() {
  const t = useT(strings);
  const d = useDoc();
  const short = jobsIn(d, "maybe");
  const main = mainGoal(d);
  const ranks = canRank(d);
  return (
    <Page width="wide">
      <PageHeader title={t("g_title")} lede={t("g_lede")} />
      <div className="grid gap-[18px] min-[1000px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] min-[1000px]:items-start">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <BoardCard />
          {main && <OtherRoutes />}
        </div>
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Panel aria-labelledby="goals-short">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <PanelTitle id="goals-short">{t("g_short")}</PanelTitle>
                <Hint>{t("g_short_p")}</Hint>
              </div>
            </div>
            {short.length ? <MiniList jobs={short} inPanel narrow /> : <Hint>{t("g_short_none")}</Hint>}
          </Panel>
          {/* one dark button per screen: without a goal the empty board has it. Before ideas can be ranked
              the empty board already explains why and leads to part 2, so this panel waits for a goal */}
          {(ranks || main) && (
            <section className="flex flex-col items-start gap-2 rounded-panel bg-accent-soft p-5">
              <div className="flex flex-col items-start gap-2">
                <h2 className="text-title">{t("g_ideas_h")}</h2>
                <p className="text-ink-2">{ranks ? t("g_ideas_p") : t("g_ideas_need")}</p>
                {ranks ? (
                  <Button
                    variant={main ? "primary" : "soft"}
                    className="mt-1"
                    onClick={() => go("goals/ideas")}
                  >
                    <Icon name="cards" />
                    {t("g_ideas_btn")}
                  </Button>
                ) : (
                  <Button variant="primary" className="mt-1" onClick={() => go("profile/int")}>
                    <Icon name="arrow" />
                    {t("g_ideas_go")}
                  </Button>
                )}
              </div>
            </section>
          )}
          <AddJob />
        </div>
      </div>
    </Page>
  );
}

function MiniList({ jobs, inPanel, narrow }: { jobs: Job[]; inPanel?: boolean; narrow?: boolean }) {
  return (
    <ul
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-2.5",
        narrow && "min-[1000px]:grid-cols-1",
      )}
    >
      {jobs.map((j) => (
        <li key={j.id} className="flex">
          <MiniCard job={j} inPanel={inPanel} />
        </li>
      ))}
    </ul>
  );
}

/** A saved job as a row: goal tag, title, and how well it matches (score, band, the two reasons). Opens the
 *  job page. */
function MiniCard({ job, inPanel }: { job: Job; inPanel?: boolean }) {
  const t = useT(strings);
  const d = useDoc();
  const isMain = job.id === mainGoal(d)?.id;
  const m = useMatch(job.occ ?? -1, job);
  const f = useFitText();
  return (
    <a
      href={"#goals/job/" + job.id}
      onClick={(e) => {
        e.preventDefault();
        go("goals/job/" + job.id);
      }}
      className={cn(
        "group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-card py-3.5 pr-3.5 pl-4 no-underline transition-[transform,box-shadow,background-color] duration-150",
        inPanel
          ? "bg-surface-2 hover:bg-sunk"
          : "bg-surface shadow-card hover:-translate-y-px hover:shadow-lift",
      )}
    >
      <span className="flex min-w-0 flex-col items-start gap-1.5">
        {job.role === "goal" && (
          <Tag tone="goal">
            <Icon name="flag" />
            {t(isMain ? "g_main" : "g_goal")}
          </Tag>
        )}
        <b className="font-display text-lead leading-snug font-semibold">
          <Title text={job.title} split />
        </b>
      </span>
      {m ? (
        <FitBadge
          score={m.score}
          className="row-span-2 transition-transform duration-150 group-hover:scale-105"
        />
      ) : (
        <Icon
          name="chev"
          className="row-span-2 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5"
        />
      )}
      {m && (
        <span className="col-start-1 text-caption font-bold text-ink-3">
          <span className="sr-only">{t("m_sr", { n: m.score })} </span>
          {f.line(m)}
        </span>
      )}
    </a>
  );
}

/** "Have a job in mind?": a catalogue job you saved opens; anything else goes on the shortlist. */
function AddJob() {
  const t = useT(strings);
  const tm = useT(mergeStrings);
  const E = useEscoReady();
  const [text, setText] = useState("");
  const occHits = useOccSearch(E, text, 8);
  const sugg = useMemo(() => occHits.map((o) => occLabel(E, o)), [E, occHits]);
  const add = (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    const m = searchOcc(E, v, 1);
    const occ = m.length ? m[0] : -1;
    const have = occ >= 0 ? jobForOcc(getDoc(), occ) : null;
    if (have) {
      go("goals/job/" + have.id);
      return;
    }
    const title = occ >= 0 && normTxt(occLabel(E, occ)) === normTxt(v) ? occLabel(E, occ) : v;
    /* the same title saved already (a job outside the catalogue): open it instead of a second one */
    const same = jobMatch(getDoc(), { title, occ });
    if (same) {
      toast(tm("k_saved_job", { x: same.title }));
      go("goals/job/" + same.id);
      return;
    }
    update((dr) => {
      addJob(dr, { title, occ, role: "maybe" });
      if (occ >= 0) setVote(dr, occ, 1);
    });
    toast(t("g_added", { x: title }));
    setText("");
  };
  return (
    <Panel aria-labelledby="goals-add" className="@container">
      <PanelTitle id="goals-add">{t("g_add_h")}</PanelTitle>
      {/* side by side only when the box is wide enough for the German placeholder (not in the side column) */}
      <form onSubmit={add} className="flex flex-col gap-2.5 @[32rem]:flex-row @[32rem]:items-start">
        <label htmlFor="goals-add-in" className="sr-only">
          {t("g_add_h")}
        </label>
        <SuggestInput
          id="goals-add-in"
          value={text}
          onValueChange={setText}
          suggestions={sugg}
          placeholder={t("g_add_ph")}
        />
        <Button type="submit" className="self-start">
          <Icon name="plus" />
          {t("g_add_btn")}
        </Button>
      </form>
    </Panel>
  );
}
