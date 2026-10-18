import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Job } from "@/data/types";
import { jobsIn } from "@/data/doc";
import { useDoc } from "@/data/store";
import { canRank } from "@/domain/rank";
import { useEscoReady } from "@/app/catalog";
import { go } from "@/app/router";
import { jobCount, type Tile } from "@/domain/skills";
import { openFinder, openItem } from "@/features/courses/api";
import { useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Icon, LinkButton, Mascot } from "@/ui";
import { boardPath, segmentLit, type BoardPath, type Milestone, type PathCourse } from "./layout";
import { openSkill } from "./openSkill";
import { strings } from "./strings";
import "./board.css";

/* =================== THE BOARD: A PATH WITH MILESTONES ===================
   A goal's way from You to the job: what you have, what your saved courses cover, what is still to learn.
   One line runs through the milestones, apricot up to where you are (the guide stands there), grey after.
   The one next step stands out in ink: the first skill no course covers (find a course for it), or starting
   a course once every skill is covered, or job ads once you have them all. Every skill opens its sheet (rate
   it, see its courses, find one). Narrow boxes get the path down the left; wide boxes (a container query,
   not the window) lay the milestones out as columns along a line. It reads the document, so rating a skill
   or saving a course moves things at once; what arrives gets a small pop. */

/** Skill chips shown per milestone before "+N more". */
const CHIPS = 8;

export function Board({ job }: { job: Job }) {
  const t = useT(strings);
  const lang = useLang();
  const E = useEscoReady();
  const d = useDoc();
  const tiles = useMemo(() => jobCount(d, E, job.occ, job).tiles, [d, E, job]);
  const courses = d.courses;
  const p = useMemo(
    () =>
      boardPath(
        tiles,
        courses.filter((c) => c.goals.includes(job.id)),
      ),
    [tiles, courses, job.id],
  );
  const from = useMemo(() => {
    const titles = jobsIn(d, "done")
      .map((j) => j.title.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((x) => (lang === "en" && /^[A-Z][a-z]/.test(x) ? x[0].toLowerCase() + x.slice(1) : x));
    return titles.length ? new Intl.ListFormat(lang, { type: "conjunction" }).format(titles) : "";
  }, [d, lang]);
  const fresh = useFresh(tiles.map((x) => x.state + ":" + x.key));
  const open = (x: Tile) => openSkill(x.x, job.occ, job.id);
  const chip = (x: Tile) => ({ tile: x, fresh: fresh.has(x.state + ":" + x.key), onOpen: () => open(x) });

  const cols = p.milestones
    .map((m) =>
      m === "you" || (m === "job" && p.here !== "job")
        ? "56px"
        : m === "have"
          ? "minmax(0,1fr)"
          : m === "courses"
            ? p.courses.length
              ? "minmax(0,1.15fr)"
              : "minmax(0,0.8fr)"
            : "minmax(0,1.35fr)",
    )
    .join(" ");

  const nextCourse = p.next.kind === "course" ? p.next.course : null;
  const body = (m: Milestone): ReactNode => {
    switch (m) {
      case "you":
        return from ? (
          <p className="ms-from min-h-10 content-center text-small text-ink-2">{t("b_from", { x: from })}</p>
        ) : null;
      case "have":
        return p.have.length ? (
          <>
            <p className="ms-title">{t("b_have", { n: p.have.length })}</p>
            <ChipList items={p.have.map(chip)} />
          </>
        ) : (
          <p className="ms-title ms-quiet">{t("b_have_none")}</p>
        );
      case "courses":
        return p.courses.length ? (
          <>
            <p className="ms-title">{t("b_courses", { n: p.course.length })}</p>
            {p.courses.map((c) => (
              <CourseCard key={c.id} c={c} jobId={job.id} fresh={fresh} onSkill={open} />
            ))}
            {nextCourse && (
              <NextTile
                key={"c" + nextCourse.id}
                eyebrow={t("b_next_course")}
                title={nextCourse.name}
                onTitle={() => openItem("course", nextCourse.id, job.id)}
                action={
                  <Button
                    size="sm"
                    className="shadow-none"
                    onClick={() => openItem("course", nextCourse.id, job.id)}
                  >
                    <Icon name="book" />
                    {t("b_open_course")}
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <div className="flex min-h-10 flex-wrap items-center gap-x-3">
            <p className="ms-quiet">{t("b_course_none")}</p>
            <LinkButton className="text-small" onClick={() => openFinder("course", job.id)}>
              {t("d_find_course")}
            </LinkButton>
          </div>
        );
      case "learn": {
        const first = p.next.kind === "skill" ? p.next.tile : null;
        return (
          <>
            <p className="ms-title">{t("b_learn", { n: p.learn.length })}</p>
            {first && (
              <NextTile
                key={"s" + first.key}
                eyebrow={t("b_next")}
                title={first.name}
                onTitle={() => open(first)}
                action={
                  <Button
                    size="sm"
                    className="shadow-none"
                    onClick={() => openFinder("course", job.id, first.x)}
                  >
                    <Icon name="search" />
                    {t("d_find_course")}
                  </Button>
                }
              />
            )}
            {p.learn.length > 1 && <ChipList items={p.learn.slice(1).map(chip)} />}
          </>
        );
      }
      case "job":
        return (
          <>
            <p className={cn("ms-title", p.here !== "job" && "ms-wide-hide")}>{job.title}</p>
            {p.here !== "job" && <p className="ms-caption">{t("b_end")}</p>}
            {p.next.kind === "done" && (
              <div className="flex animate-pop-in flex-col items-start gap-2 rounded-card bg-[linear-gradient(135deg,var(--have-bg),var(--course-bg))] p-4">
                <p className="font-display text-title font-semibold">{t("b_all_h")}</p>
                <p className="text-small text-ink-2">{t("b_all_p")}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-1"
                  onClick={() => openFinder("jobad", job.id)}
                >
                  <Icon name="bag" />
                  {t("d_find_ads")}
                </Button>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="path" data-here={p.here}>
      <ol className="path-list" style={{ "--path-cols": cols } as CSSProperties}>
        {p.milestones.map((m, i) => (
          <li
            key={m}
            className="ms"
            data-ms={m}
            data-narrow={cols.split(" ")[i] === "56px" || undefined}
            data-lit={segmentLit(p, i) || undefined}
          >
            <Square m={m} p={p} />
            {p.here === m && <span className="sr-only">{t("b_you_here")}: </span>}
            <div className="ms-body">{body(m)}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A milestone's square, with the guide on it when you are there. Decorative: the text says it all. */
function Square({ m, p }: { m: Milestone; p: BoardPath }) {
  const t = useT(strings);
  const quiet = (m === "have" && !p.have.length) || (m === "courses" && !p.courses.length);
  return (
    <span className={`ms-sq ms-sq-${m}`} data-quiet={quiet || undefined} aria-hidden="true">
      {m === "you" ? (
        t("b_you")
      ) : m === "have" ? (
        <Icon name="check" />
      ) : m === "courses" ? (
        <Icon name="book" />
      ) : m === "learn" ? (
        p.learn.length
      ) : (
        <Icon name="flag" />
      )}
      {p.here === m && (
        <span className="ms-token" key={m}>
          <Mascot size={30} mood={m === "job" ? "yay" : ""} />
        </span>
      )}
    </span>
  );
}

interface ChipItem {
  tile: Tile;
  fresh: boolean;
  onOpen: () => void;
}
/** Skills as chips that open the skill sheet; a long list shows the first few and "+N more". */
function ChipList({ items }: { items: ChipItem[] }) {
  const t = useT(strings);
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, CHIPS);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(({ tile, fresh, onOpen }) => (
        <button
          key={tile.key}
          type="button"
          className={cn("ms-chip", `ms-chip-${tile.state}`, fresh && "ms-fresh")}
          onClick={onOpen}
        >
          {tile.name}
          <span className="sr-only">, {t(tile.state === "have" ? "c_legend_have" : "c_legend_learn")}</span>
        </button>
      ))}
      {items.length > CHIPS && (
        <button
          type="button"
          className="ms-chip ms-chip-more"
          aria-expanded={all}
          onClick={() => setAll(!all)}
        >
          {all ? t("show_less") : t("b_more", { n: items.length - CHIPS })}
        </button>
      )}
    </div>
  );
}

/** A saved course: its name opens it, each skill it covers opens the skill. */
function CourseCard({
  c,
  jobId,
  fresh,
  onSkill,
}: {
  c: PathCourse;
  jobId: string;
  fresh: Set<string>;
  onSkill: (x: Tile) => void;
}) {
  const t = useT(strings);
  return (
    <div className="flex flex-col gap-1 rounded-option bg-surface-2 px-3 py-2.5">
      <button
        type="button"
        className="ms-link self-start text-left text-caption font-extrabold text-course-ink"
        onClick={() => openItem("course", c.id, jobId)}
      >
        {c.name}
      </button>
      {c.skills.length ? (
        <p className="text-caption text-ink-2">
          {c.skills.map((x, i) => (
            <span key={x.key} className={cn(fresh.has(x.state + ":" + x.key) && "ms-fresh inline-block")}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <button type="button" className="ms-link text-left" onClick={() => onSkill(x)}>
                {x.name}
              </button>
            </span>
          ))}
        </p>
      ) : (
        <p className="text-caption text-ink-3">{t("b_course_nothing")}</p>
      )}
    </div>
  );
}

/** The one next step, in ink. */
function NextTile({
  eyebrow,
  title,
  onTitle,
  action,
}: {
  eyebrow: string;
  title: string;
  onTitle: () => void;
  action: ReactNode;
}) {
  return (
    <div className="flex animate-deal-in flex-col items-start gap-2 rounded-card bg-ink p-3.5 text-canvas">
      <span className="text-caption font-extrabold tracking-[.08em] text-canvas/75 uppercase">{eyebrow}</span>
      <button
        type="button"
        className="ms-link text-left font-display text-title leading-tight font-semibold"
        onClick={onTitle}
      >
        {title}
      </button>
      <div className="mt-0.5">{action}</div>
    </div>
  );
}

/** The keys that arrived since the last change (none on the first render), so new chips can pop in. */
function useFresh(keys: string[]): Set<string> {
  const sig = keys.join("\n");
  const [s, setS] = useState(() => ({ sig, seen: new Set(keys), fresh: new Set<string>() }));
  if (s.sig !== sig) {
    setS({ sig, seen: new Set(keys), fresh: new Set(keys.filter((k) => !s.seen.has(k))) });
  }
  return s.fresh;
}

/** No goal yet: You, a dashed line, a question mark, and the way to job ideas. Without interests or rated
 *  skills there are no ideas yet, so the button leads to the part that unlocks them instead. */
export function EmptyBoard({ button = true }: { button?: boolean }) {
  const t = useT(strings);
  const ranks = useDoc(canRank);
  return (
    <div className="qboard">
      <span className="sq sq-start">
        <Mascot size={26} className="mascot-in" />
        <b>{t("b_you")}</b>
      </span>
      <span className="qboard-dash" aria-hidden="true" />
      <span className="sq sq-q" aria-hidden="true">
        ?
      </span>
      <div className="flex flex-col items-start gap-1.5">
        <h3 className="text-title">{t("q_title")}</h3>
        <p className="text-ink-2">{t("q_p")}</p>
        {button &&
          (ranks ? (
            <Button variant="primary" className="mt-1.5" onClick={() => go("goals/ideas")}>
              <Icon name="cards" />
              {t("q_btn")}
            </Button>
          ) : (
            <>
              <p className="text-small text-ink-3">{t("g_ideas_need")}</p>
              <Button variant="primary" className="mt-1.5" onClick={() => go("profile/int")}>
                <Icon name="arrow" />
                {t("g_ideas_go")}
              </Button>
            </>
          ))}
      </div>
    </div>
  );
}
