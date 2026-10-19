import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { Job } from "@/data/types";
import { jobsIn } from "@/data/doc";
import { useDoc } from "@/data/store";
import { canRank } from "@/domain/rank";
import { useEsco } from "@/app/catalog";
import { go } from "@/app/router";
import { jobCount } from "@/domain/skills";
import { courseForJob } from "@/data/routes";
import { coversThis } from "@/features/routes/actions";
import { strings as routeStrings } from "@/features/routes/strings";
import { openFinder, openItem } from "@/features/courses/api";
import { useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Icon, LineMark, LinkButton } from "@/ui";
import {
  boardLine,
  boardPath,
  courseBadges,
  type BoardPath,
  type LineRow,
  type PathCourse,
  type Zone,
} from "./layout";
import { openSkill } from "./openSkill";
import { strings } from "./strings";
import "./board.css";

/* =================== THE BOARD: THE LINE ===================
   A goal's way from You to the job, drawn as a transit line with one stop per skill: the skills you have
   (filled, green), then "You are here", then the skills your saved courses cover (ringed in course blue, with
   a badge naming the course), then the next stop (a highlighted card) and the rest still to learn (grey
   rings), and the job as the last stop. Ground covered is a solid green line, the rest grey track. Every
   skill opens its sheet (rate it, see its courses, find one). It reads the document, so rating a skill or
   saving a course moves things at once; what arrives gets a small pop. Wide boxes (a container query, not
   the window) wrap the line into two columns. */

/** Stops shown per group before "+N more". */
const CAP = 8;

/** The person's initial for the "You are here" pill, or null without a name. */
const initial = (name: string): string | null => {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : null;
};

export function Board({ job }: { job: Job }) {
  const t = useT(strings);
  const lang = useLang();
  const E = useEsco();
  const d = useDoc();
  const tiles = useMemo(() => jobCount(d, E, job.occ, job).tiles, [d, E, job]);
  /* only the course of the job's route counts on its line */
  const rc = courseForJob(d, job.id);
  const p = useMemo(() => boardPath(tiles, rc ? [rc] : []), [tiles, rc]);
  const [open, setOpen] = useState<ReadonlySet<Zone>>(() => new Set());
  const rows = useMemo(() => boardLine(p, CAP, open), [p, open]);
  const badges = useMemo(() => courseBadges(p.courses), [p.courses]);
  const from = useMemo(() => {
    const titles = jobsIn(d, "done")
      .map((j) => j.title.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((x) => (lang === "en" && /^[A-Z][a-z]/.test(x) ? x[0].toLowerCase() + x.slice(1) : x));
    return titles.length ? new Intl.ListFormat(lang, { type: "conjunction" }).format(titles) : "";
  }, [d, lang]);
  const fresh = useFresh(tiles.map((x) => x.state + ":" + x.key));
  const me = initial(d.profile.name);
  const toggle = (z: Zone) =>
    setOpen((s) => {
      const n = new Set(s);
      if (!n.delete(z)) n.add(z);
      return n;
    });

  if (!tiles.length) return <CustomLine job={job} />;

  const done = p.next.kind === "done";
  const row = (r: LineRow): ReactNode => {
    switch (r.kind) {
      case "start":
        return (
          <Row r={r} dot={<span className="lr-dot lr-dot-start" />}>
            <span className="flex min-h-11 flex-col justify-center py-1">
              <b className="text-label font-extrabold">{t("b_you")}</b>
              {from && <span className="text-small text-ink-2">{t("b_from", { x: from })}</span>}
            </span>
          </Row>
        );
      case "zone":
        return (
          <Row r={r} kind="zone">
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="lr-zone">
                {r.zone === "have"
                  ? t("b_have", { n: r.n })
                  : r.zone === "learn"
                    ? t("b_learn", { n: r.n })
                    : r.n
                      ? t("b_courses", { n: r.n })
                      : t("b_courses0")}
              </h3>
              {r.zone === "courses" && <CourseKey courses={p.courses} badges={badges} jobId={job.id} />}
            </div>
          </Row>
        );
      case "stop": {
        const x = r.tile;
        const badge = x.state === "course" && x.course ? badges.get(x.course.id) : undefined;
        return (
          <Row
            r={r}
            dot={
              <span className={cn("lr-dot", `lr-dot-${x.state}`, x.also && "lr-dot-also")}>
                {x.state === "have" && <Icon name="check" />}
              </span>
            }
          >
            <button
              type="button"
              className={cn("lr-stop", fresh.has(x.state + ":" + x.key) && "lr-fresh")}
              onClick={() => openSkill(x.x, job.occ, job.id)}
            >
              <span className={cn("min-w-0", x.state === "learn" ? "text-ink-2" : "text-ink")}>{x.name}</span>
              {badge && (
                <span className="lr-badge" aria-hidden="true">
                  {badge}
                </span>
              )}
              <span className="sr-only">
                ,{" "}
                {x.state === "course" && x.course
                  ? t("b_covered_by", { x: x.course.name })
                  : x.also && x.course
                    ? t("b_also", { x: x.course.name })
                    : t(x.state === "have" ? "c_legend_have" : "c_legend_learn")}
              </span>
            </button>
          </Row>
        );
      }
      case "more":
        return (
          <Row r={r} dot={<span className="lr-dot lr-dot-more" />}>
            <LinkButton className="text-small" aria-expanded={r.open} onClick={() => toggle(r.zone)}>
              {r.open ? t("show_less") : t("b_more", { n: r.n })}
            </LinkButton>
          </Row>
        );
      case "here":
        return (
          <Row r={r} kind="here">
            <span className="lr-here">
              <span className="lr-here-me" aria-hidden="true">
                {me ?? <Icon name="person" />}
              </span>
              {p.have.length ? t("b_you_here") : t("b_at_start")}
            </span>
          </Row>
        );
      case "next":
        return (
          <Row r={r} kind="next" dot={<span className="lr-dot lr-dot-next" />}>
            <NextStop p={p} job={job} badge={rc ? badges.get(rc.id) : undefined} />
          </Row>
        );
      case "job":
        return (
          <Row
            r={r}
            kind="job"
            dot={
              <span className={cn("lr-dot lr-dot-job", done && "lr-dot-arrived")}>
                {done ? <Icon name="check" /> : t("b_end")}
              </span>
            }
          >
            <span className="flex min-h-11 flex-col justify-center py-1">
              <b className="font-display text-title leading-tight font-extrabold">{job.title}</b>
              {!done && <span className="text-small text-ink-2">{t("b_last")}</span>}
            </span>
          </Row>
        );
    }
  };

  return (
    <div className="line">
      <ol className="line-list" aria-label={t("b_line")}>
        {rows.map((r) => (
          <Fragment key={rowKey(r)}>{row(r)}</Fragment>
        ))}
      </ol>
    </div>
  );
}

const rowKey = (r: LineRow): string =>
  r.kind === "stop" ? "s" + r.tile.key : r.kind === "zone" || r.kind === "more" ? r.kind + r.zone : r.kind;

/** One row of the line: the track (solid where ground is covered), the stop's dot on it, and the content. */
function Row({
  r,
  kind,
  dot,
  children,
}: {
  r: LineRow;
  kind?: "zone" | "here" | "next" | "job";
  dot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="lr" data-kind={kind} data-lit={r.lit || undefined}>
      <span className="lr-rail" aria-hidden="true">
        {dot}
      </span>
      <div className="lr-body">{children}</div>
    </li>
  );
}

/** Which badge stands for which course: each opens the course. A course saved for this job that covers
 *  none of its skills says so. */
function CourseKey({
  courses,
  badges,
  jobId,
}: {
  courses: PathCourse[];
  badges: Map<string, string>;
  jobId: string;
}) {
  const t = useT(strings);
  return (
    <ul className="flex flex-col">
      {courses.map((c) => (
        <li key={c.id}>
          <button type="button" className="lr-course" onClick={() => openItem("course", c.id, jobId)}>
            <span className="lr-badge" aria-hidden="true">
              {badges.get(c.id)}
            </span>
            <span className="min-w-0">
              <span className="lr-course-name">{c.name}</span>
              {!c.skills.length && (
                <span className="block text-caption text-ink-3">{t("b_course_nothing")}</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The next stop, highlighted: the first skill still to learn (find a course, or say you can do it), starting
 *  your course once every skill is covered, or job ads once you have them all. */
function NextStop({ p, job, badge }: { p: BoardPath; job: Job; badge?: string }) {
  const t = useT(strings);
  const tr = useT(routeStrings);
  const rc = courseForJob(useDoc(), job.id);
  const n = p.next;
  if (n.kind === "skill")
    return (
      <NextCard
        key={"s" + n.tile.key}
        eyebrow={t("b_next")}
        title={n.tile.name}
        onTitle={() => openSkill(n.tile.x, job.occ, job.id)}
      >
        <Button size="sm" variant="primary" onClick={() => openFinder("course", job.id, n.tile.x)}>
          <Icon name="search" />
          {t("d_find_course")}
        </Button>
        <Button size="sm" onClick={() => openSkill(n.tile.x, job.occ, job.id)}>
          {t("b_can")}
        </Button>
        {/* the route's course teaches it after all (it was missed when the course was saved) */}
        {rc && (
          <Button size="sm" variant="ghost" onClick={() => coversThis(rc.id, n.tile.x, n.tile.name)}>
            <Icon name="book" />
            {tr("r_covers_this", { c: badge ?? rc.name })}
          </Button>
        )}
      </NextCard>
    );
  if (n.kind === "course")
    return (
      <NextCard
        key={"c" + n.course.id}
        eyebrow={t("b_next_course")}
        title={n.course.name}
        onTitle={() => openItem("course", n.course.id, job.id)}
      >
        <Button size="sm" variant="primary" onClick={() => openItem("course", n.course.id, job.id)}>
          <Icon name="book" />
          {t("b_open_course")}
        </Button>
      </NextCard>
    );
  if (n.kind === "done")
    return (
      <div className="lr-next animate-pop-in">
        <LineMark height={26} state="arrived" />
        <p className="font-display text-heading leading-tight font-extrabold">{t("b_all_h")}</p>
        <p className="text-small text-ink-2">{t("b_all_p")}</p>
        <div>
          <Button variant="primary" size="sm" onClick={() => openFinder("jobad", job.id)}>
            <Icon name="bag" />
            {t("d_find_ads")}
          </Button>
        </div>
      </div>
    );
  return null;
}

function NextCard({
  eyebrow,
  title,
  onTitle,
  children,
}: {
  eyebrow: string;
  title: string;
  onTitle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="lr-next animate-deal-in">
      <span className="font-display text-caption font-bold tracking-[.08em] text-have-ink uppercase">
        {eyebrow}
      </span>
      <button
        type="button"
        className="min-h-11 self-start text-left font-display text-heading leading-tight font-extrabold underline-offset-4 hover:underline"
        onClick={onTitle}
      >
        {title}
      </button>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** A goal outside the catalogue: You, a dashed track, the job, and why there are no stops in between. */
function CustomLine({ job }: { job: Job }) {
  const t = useT(strings);
  return (
    <div className="flex flex-col gap-3">
      <MiniLine end={t("b_end")} />
      <p className="text-small text-ink-2">
        <b className="text-ink">{job.title}</b>: {t("d_custom")}
      </p>
    </div>
  );
}

/** You, a dashed track, and the end of the line (the job, or a question mark without one). Decorative. */
function MiniLine({ end, unknown }: { end: string; unknown?: boolean }) {
  return (
    <span className="flex items-center" aria-hidden="true">
      <span className="lr-dot lr-dot-start lr-dot-lg">A</span>
      <span className="qline-dash" />
      <span className={cn("lr-dot lr-dot-job lr-dot-lg", unknown && "lr-dot-unknown")}>{end}</span>
    </span>
  );
}

/** The keys that arrived since the last change (none on the first render), so new stops can pop in. */
function useFresh(keys: string[]): Set<string> {
  const sig = keys.join("\n");
  const [s, setS] = useState(() => ({ sig, seen: new Set(keys), fresh: new Set<string>() }));
  if (s.sig !== sig) {
    setS({ sig, seen: new Set(keys), fresh: new Set(keys.filter((k) => !s.seen.has(k))) });
  }
  return s.fresh;
}

/** No goal yet: You, a dashed track, a question mark, and the way to job ideas. Without interests or rated
 *  skills there are no ideas yet, so the button leads to the part that unlocks them instead. */
export function EmptyBoard({ button = true }: { button?: boolean }) {
  const t = useT(strings);
  const ranks = useDoc(canRank);
  return (
    <div className="flex flex-col items-start gap-4">
      <MiniLine end="?" unknown />
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

/** The line's place while the catalogue loads, so nothing jumps when it comes. Decorative. */
export function BoardSkeleton() {
  return (
    <div className="line" aria-hidden="true">
      <ol className="line-list">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="lr" data-lit={i < 3 || undefined}>
            <span className="lr-rail">
              <span className={cn("lr-dot", i < 3 ? "lr-dot-have" : "lr-dot-learn")} />
            </span>
            <div className="lr-body">
              <span
                className="h-3.5 animate-pulse rounded-full bg-sunk"
                style={{ width: `${[38, 62, 50, 70, 44, 58][i]}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
