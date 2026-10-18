import type { ReactNode } from "react";
import { useDoc } from "@/data/store";
import { go } from "@/app/router";
import { userInterests } from "@/domain/assess";
import type { Match } from "@/domain/match";
import { cn } from "@/lib/cn";
import { SkillBar } from "@/ui";
import { ringArcs } from "./fit";
import { useFitText } from "./useFit";
import "./fit.css";

/* =================== HOW WELL A JOB MATCHES ===================
   One score (0–100) with its two reasons, interests and skills (domain/match.ts).
   FitBlock: the card front's ring, label and one-line summary, then the two reasons as labelled rows.
   On the main goal, once a saved course covers something, the label says "today" and a lighter arc and a
   line show what the score becomes with the courses. FitBadge + useFitText().line: the compact form for
   lists. The visuals are hidden from screen readers; one sentence reads the whole block instead.
   The words and the match itself come from useFit.ts. */

/** The ring: the score in ink, on the main goal a lighter arc on to the score with courses. */
function Ring({ score, withCourses }: { score: number; withCourses: number | null }) {
  const a = ringArcs(score, withCourses);
  return (
    <span className="fit-ring relative flex size-16 flex-none" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r="27" className="fill-none stroke-sunk" strokeWidth="7" />
        {a.ext > 0 && (
          <circle
            cx="32"
            cy="32"
            r="27"
            pathLength={100}
            className="ring-ext fill-none stroke-course"
            strokeWidth="7"
            style={{ strokeDasharray: `${a.score + a.ext} 100` }}
          />
        )}
        {a.score > 0 && (
          <circle
            cx="32"
            cy="32"
            r="27"
            pathLength={100}
            className="ring-arc fill-none stroke-ink"
            strokeWidth="7"
            strokeLinecap="round"
            style={{ strokeDasharray: `${a.score} 100` }}
          />
        )}
      </svg>
      <b className="absolute inset-0 flex items-center justify-center font-display text-[1.375rem] font-semibold tabular-nums">
        {a.score}
      </b>
    </span>
  );
}

/** The card front's match: the ring and what it means, then interests and skills as two rows. */
export function FitBlock({ m, main }: { m: Match; main: boolean }) {
  const f = useFitText();
  const { t } = f;
  const answered = useDoc((d) => !!userInterests(d));
  const rising = f.rising(m, main);
  const label = "text-small font-extrabold text-ink";
  const num = "text-right text-small font-extrabold text-ink-2 tabular-nums";
  const note = "col-span-2 col-start-2 -mt-0.5 text-caption text-ink-3";
  return (
    <div className="flex flex-col gap-3.5">
      <p className="sr-only">{f.sr(m, main)}</p>
      <div className="flex items-center gap-3.5 rounded-card bg-surface-2 p-3.5" aria-hidden="true">
        <Ring score={m.score} withCourses={rising ? m.withCourses : null} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <b className="font-display text-title font-semibold">{f.label(m, main)}</b>
          {rising ? (
            <span className="text-small text-ink-2">
              <Parts text={t("m_rises", { x: "\u0000" })}>
                <b className="text-course-ink">{f.risesX(m)}</b>
              </Parts>
            </span>
          ) : (
            <span className="text-small text-ink-2">{f.summary(m)}</span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5">
        <span className={label} aria-hidden="true">
          {t("m_int")}
        </span>
        {m.interest != null ? (
          <>
            <span className="h-3 overflow-hidden rounded-[6px] bg-sunk" aria-hidden="true">
              <span
                className="fit-bar block h-full rounded-[6px] bg-ink-2"
                style={{ width: `${m.interest}%` }}
              />
            </span>
            <span className={cn(num, "min-w-7")} aria-hidden="true">
              {m.interest}
            </span>
            <span className={note} aria-hidden="true">
              {f.interestLine(m)}
            </span>
          </>
        ) : answered ? (
          <span className="col-span-2 text-caption text-ink-3" aria-hidden="true">
            {t("m_int_none")}
          </span>
        ) : (
          <a
            href="#profile/int"
            onClick={(e) => {
              e.preventDefault();
              go("profile/int");
            }}
            className="col-span-2 -my-2.5 inline-flex min-h-11 items-center self-center text-caption font-bold text-course-ink underline underline-offset-2 hover:text-ink"
          >
            {t("m_int_go")}
          </a>
        )}
        <span className={cn(label, "mt-2")} aria-hidden="true">
          {t("m_sk")}
        </span>
        <span className="mt-2" aria-hidden="true">
          <SkillBar have={m.have} course={m.course} total={m.total} label={f.core(m)} />
        </span>
        <span className={cn(num, "mt-2 min-w-7")} aria-hidden="true">
          {m.skills}
        </span>
        <span className={note} aria-hidden="true">
          {f.core(m)}
          {m.course > 0 && (
            <>
              {" · "}
              <b className="text-course-ink">{f.course(m)}</b>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/** A translated sentence with one placeholder ("\u0000") replaced by rich content. */
function Parts({ text, children }: { text: string; children: ReactNode }) {
  const [a, b = ""] = text.split("\u0000");
  return (
    <>
      {a}
      {children}
      {b}
    </>
  );
}

/** The compact score for lists: a small ink square with the number. Decorative: put useFitText().line and
 *  the score in text next to it. */
export function FitBadge({ score, className }: { score: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-11 flex-none items-center justify-center rounded-tile bg-ink font-display text-lead font-semibold text-canvas tabular-nums",
        className,
      )}
    >
      {score}
    </span>
  );
}
