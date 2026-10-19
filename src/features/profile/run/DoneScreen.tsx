import type { PartKey } from "@/data/types";
import { go } from "@/app/router";
import { useDoc } from "@/data/store";
import { PARTS, partStatus } from "@/domain/assess";
import { useT } from "@/i18n";
import { ActionBar, Button, Icon, LineMark, StepPills } from "@/ui";
import { partAfter } from "../logic";
import { strings } from "../strings";
import { useStepFocus } from "./hooks";
import { StepHeading } from "./RunFrame";
import "./confetti.css";

/* A part is finished: a small celebration, the six pills, and where to go next. */
export function DoneScreen({ part }: { part: PartKey }) {
  const t = useT(strings);
  const doc = useDoc();
  const heading = useStepFocus<HTMLHeadingElement>(part);
  const nx = partAfter(doc, part);
  const steps = PARTS.map((k) => partStatus(doc, k).done);
  return (
    <div className="relative flex min-h-[calc(100dvh-170px)] flex-col items-center justify-center gap-3.5 pt-5 text-center">
      <div className="confetti" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <LineMark height={44} state="arrived" className="animate-pop-in" />
      <StepHeading ref={heading}>{t("run_done_h", { n: PARTS.indexOf(part) + 1 })}</StepHeading>
      <p className="max-w-[44ch] text-lead text-ink-2">{nx ? t("run_done_p") : t("run_all_done")}</p>
      <StepPills
        steps={steps}
        size="lg"
        label={t("of", { h: steps.filter(Boolean).length, t: PARTS.length })}
        className="mt-1"
      />
      <ActionBar static className="mt-4 w-full max-w-[420px] flex-col md:flex-row md:justify-center">
        {nx ? (
          <Button variant="primary" onClick={() => go("profile/" + nx)}>
            {t("run_next", { n: PARTS.indexOf(nx) + 1 })}
            <Icon name="arrow" />
          </Button>
        ) : (
          <Button variant="primary" onClick={() => go("goals")}>
            {t("run_go_goals")}
            <Icon name="arrow" />
          </Button>
        )}
        <Button onClick={() => go("profile")}>{t("run_overview")}</Button>
      </ActionBar>
    </div>
  );
}
