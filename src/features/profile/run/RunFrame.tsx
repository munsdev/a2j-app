import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { PartKey } from "@/data/types";
import { go } from "@/app/router";
import { PARTS } from "@/domain/assess";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Icon, RunHeader } from "@/ui";
import { strings } from "../strings";

/* The frame of a part in progress: header with the way back to the overview, "Part n · name", count and
   track, then the step, then the sticky action bar. Tall enough that the bar sits at the bottom of the screen.
   Every part's bar has the same three slots, in this order: BackButton (secondary), PauseButton (ghost; on
   the skill cards "Finish for now"), then the primary action (Next / Skip / Save / Done). */
export function RunFrame({
  part,
  step,
  children,
  swipe,
  track,
  className,
}: {
  part: PartKey;
  /** [current, total] for the count and the track */
  step?: [number, number];
  /** [value, max] for a track without a count (the count is said elsewhere, as in Values) */
  track?: [number, number];
  children: ReactNode;
  /** touch handlers from useTouchSwipe */
  swipe?: Pick<HTMLAttributes<HTMLDivElement>, "onTouchStart" | "onTouchEnd">;
  className?: string;
}) {
  const t = useT(strings);
  const n = PARTS.indexOf(part) + 1;
  return (
    <div
      {...swipe}
      /* 170px: the top bar and the page's top padding, so the action bar reaches the bottom of the screen */
      className={cn("flex min-h-[calc(100dvh-170px)] flex-col gap-4", swipe && "touch-pan-y", className)}
    >
      <RunHeader
        onBack={() => go("profile")}
        backLabel={t("run_overview")}
        eyebrow={`${t("part_n", { n })} · ${t(`part_${part}`)}`}
        count={step ? t("st_prog", { a: step[0], t: step[1] }) : undefined}
        progress={
          step ? { value: step[0], max: step[1] } : track ? { value: track[0], max: track[1] } : undefined
        }
      />
      {children}
    </div>
  );
}

/** The step's heading: receives focus on every step, so it reads first and keyboard use starts here. */
export const StepHeading = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function StepHeading({ className, ...rest }, ref) {
    return (
      <h2
        ref={ref}
        tabIndex={-1}
        className={cn("text-display outline-none focus-visible:outline-none", className)}
        {...rest}
      />
    );
  },
);

/** The top of a step: the context line, the heading and a lede, on one measure, so the line above a question
 *  and the question itself break at the same width. */
export const StepIntro = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex max-w-[62ch] flex-col gap-2 [&>*]:max-w-none", className)} {...rest} />
);

/** A grey line of context above a question. Inside StepIntro it shares the question's measure. */
export const Context = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("max-w-[62ch] text-ink-2", className)} {...rest} />
);

/** "Pause": back to the overview, low emphasis, only as wide as its word (ActionBar gives a ghost button its
 *  own row on phones). label only for the skill cards' "Finish for now", which takes this slot. */
export function PauseButton({ label, onClick }: { label?: string; onClick?: () => void }) {
  const t = useT(strings);
  return (
    <Button variant="ghost" onClick={onClick ?? (() => go("profile"))}>
      {label ?? t("run_pause")}
    </Button>
  );
}

/** Back one step. Shown disabled on a part's first step, so the bar keeps its three slots everywhere. */
export function BackButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  const t = useT(strings);
  return (
    <Button onClick={onClick} disabled={disabled}>
      <Icon name="back" />
      {t("back")}
    </Button>
  );
}

/** Skip until something is chosen, then Next. */
export function ForwardButton({ ready, onClick }: { ready: boolean; onClick: () => void }) {
  const t = useT(strings);
  return (
    <Button variant={ready ? "primary" : "soft"} onClick={onClick}>
      {t(ready ? "next" : "skip")}
      <Icon name="arrow" />
    </Button>
  );
}
