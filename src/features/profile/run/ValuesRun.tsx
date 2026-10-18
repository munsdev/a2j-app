import { useState } from "react";
import type { Doc } from "@/data/types";
import { getDoc } from "@/data/store";
import { assessOf, ensureAssess } from "@/domain/assess";
import { VALUES } from "@/domain/items";
import { pick, useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { ActionBar, Button, Icon, Lede } from "@/ui";
import { togglePickWithinMax } from "../logic";
import { optionLook } from "../constants";
import { strings } from "../strings";
import { useStepFocus } from "./hooks";
import { BackButton, PauseButton, RunFrame, StepHeading, StepIntro } from "./RunFrame";

/* Part 4: tap three values in order. The picks are kept on this screen until Save. The track and the line
   above the cards say how many are picked; a chosen card gets the selected ring and its place (1, 2, 3).
   One screen only, so Back stays in its slot, disabled, as on the first step of every part. */
const MAX = 3;

export function ValuesRun({ onFinish }: { onFinish: (recipe: (d: Doc) => void) => void }) {
  const t = useT(strings);
  const lang = useLang();
  const [picks, setPicks] = useState<string[]>(() => [...assessOf(getDoc()).values]);
  const heading = useStepFocus<HTMLHeadingElement>("val");
  const left = MAX - picks.length;
  return (
    <RunFrame part="val" track={[picks.length, MAX]}>
      <StepIntro>
        <StepHeading ref={heading}>{t("val_h")}</StepHeading>
        <Lede>{t("val_p")}</Lede>
      </StepIntro>
      <p className="text-small font-bold text-ink-3" aria-live="polite">
        {left ? t("val_left", { n: left }) : t("val_full")}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-2.5">
        {VALUES.map((v) => {
          const k = picks.indexOf(v.id);
          const on = k >= 0;
          const [name, desc] = pick(v, lang);
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={on}
              onClick={() => setPicks((p) => togglePickWithinMax(p, v.id, MAX))}
              className={cn(
                "relative flex min-h-21 flex-col gap-0.5 rounded-card bg-surface py-4 pr-4 pl-14.5 text-left transition-shadow duration-150",
                optionLook(on),
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-4 left-4 flex size-7.5 items-center justify-center rounded-full font-display font-semibold",
                  on ? "animate-fade-in bg-ink text-canvas" : "shadow-ring",
                )}
              >
                {on ? k + 1 : ""}
              </span>
              {/* the display face stops at bold, so chosen is bold here (extrabold in the text face) */}
              <span className={cn("font-display text-lead", on ? "font-bold" : "font-semibold")}>{name}</span>
              <span className={cn("text-small", on ? "text-ink" : "text-ink-2")}>{desc}</span>
            </button>
          );
        })}
      </div>
      <ActionBar>
        <BackButton disabled />
        <PauseButton />
        <Button
          variant="primary"
          disabled={!picks.length}
          onClick={() => onFinish((d) => void (ensureAssess(d).values = [...picks]))}
        >
          {t("save")}
          <Icon name="check" />
        </Button>
      </ActionBar>
    </RunFrame>
  );
}
