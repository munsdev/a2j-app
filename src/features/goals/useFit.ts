import { useMemo } from "react";
import type { Job } from "@/data/types";
import { useDoc } from "@/data/store";
import { useEscoReady, useOnet } from "@/app/catalog";
import { INTERESTS } from "@/domain/items";
import { type Match, matchOf } from "@/domain/match";
import { useLang, useT } from "@/i18n";
import { interestKey, matchSummary } from "./fit";
import { strings } from "./strings";

/* The match of a job and the words for it, shared by the card front (FitBlock), the lists and compare. */

/** The match for a job, or null when there is nothing to match (not in the catalogue, no own skills). */
export function useMatch(occ: number, job: Job | null): Match | null {
  const d = useDoc();
  const E = useEscoReady();
  const O = useOnet();
  return useMemo(() => {
    if (occ < 0 && !job?.extra?.length) return null;
    const m = matchOf(d, E, O, occ, job);
    return m.total ? m : null;
  }, [d, E, O, occ, job]);
}

/** The words of a match: label, the line under it, the reasons, and the sentence for screen readers. */
export function useFitText() {
  const t = useT(strings);
  const lang = useLang();
  return useMemo(() => {
    const rising = (m: Match, main: boolean) => main && m.withCourses != null && m.withCoursesBand != null;
    const interestLine = (m: Match) => {
      if (m.interestBand == null) return "";
      const head = t(interestKey(m.interestBand));
      const names = m.sharedInterests.map((id) => INTERESTS.find((x) => x.id === id)?.[lang][0] ?? id);
      return m.interestBand > 0 && names.length ? `${head}: ${names.join(", ")}` : head;
    };
    const risesX = (m: Match) =>
      t("m_rises_x", { n: m.withCourses ?? m.score, band: t(`mb${m.withCoursesBand ?? m.band}`) });
    const core = (m: Match) =>
      t("m_core", { h: m.have, t: m.total }) + (m.some ? t("m_core_some", { n: m.some }) : "");
    const course = (m: Match) => (m.course > 0 ? t("c_course_n", { n: m.course }) : "");
    return {
      t,
      rising,
      label: (m: Match, main: boolean) => t(rising(m, main) ? `mt${m.band}` : `m${m.band}`),
      summary: (m: Match) => t(matchSummary(m.interest, m.skills)),
      risesX,
      interestLine,
      core,
      course,
      /** compact: "Partial match · Interests 59 · Skills 3" */
      line: (m: Match) =>
        [
          t(`m${m.band}`),
          m.interest != null ? `${t("m_int")} ${m.interest}` : null,
          `${t("m_sk")} ${m.skills}`,
        ]
          .filter(Boolean)
          .join(" · "),
      sr: (m: Match, main: boolean) =>
        [
          t("m_sr", { n: m.score }),
          t(rising(m, main) ? `mt${m.band}` : `m${m.band}`) + ".",
          (rising(m, main) ? t("m_rises", { x: risesX(m) }) : t(matchSummary(m.interest, m.skills))) + ".",
          m.interest != null ? `${t("m_int")} ${m.interest}. ${interestLine(m)}.` : "",
          `${t("m_sk")} ${m.skills}: ${core(m)}${m.course ? ", " + course(m) : ""}.`,
        ]
          .filter(Boolean)
          .join(" "),
    };
  }, [t, lang]);
}
