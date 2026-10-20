import { useRef, useState } from "react";
import { getDoc, update, useDoc } from "@/data/store";
import { assessOf, ensureAssess } from "@/domain/assess";
import { APT_ITEMS, FREQ, INT_ITEMS, LIKE } from "@/domain/items";
import { pick, useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { ActionBar, Icon } from "@/ui";
import { laterStep, startWalk, stepOn, type Walk } from "../logic";
import { optionLook } from "../constants";
import { strings } from "../strings";
import { useAutoNext, useDigitKeys, useRunBack, useStepFocus, useTouchSwipe } from "./hooks";
import {
  AutoNextBox,
  BackButton,
  Context,
  ForwardButton,
  PauseButton,
  RunFrame,
  StepHeading,
  StepIntro,
} from "./RunFrame";

/* Parts 1 and 2: one statement per screen, five answers. Choosing saves quietly and, with "go on automatically"
   (on unless turned off), moves on a moment later; Next (or a swipe left) moves on or skips. Only open questions
   come up; the ones skipped come back once, one after another, at the end, then the part finishes.
   Each answer starts with a dot that grows stronger along the scale; the chosen one gets the shared selected
   treatment (ink ring, a check in place of its dot, bolder words), so it never reads as hover or focus. */
const DOT = ["opacity-18", "opacity-35", "opacity-55", "opacity-78", "opacity-100"];

export function QuestionRun({ part, onFinish }: { part: "apt" | "int"; onFinish: () => void }) {
  const t = useT(strings);
  const lang = useLang();
  const items = part === "apt" ? APT_ITEMS : INT_ITEMS;
  const scale = pick(part === "apt" ? FREQ : LIKE, lang);
  const done = (i: number) => !!assessOf(getDoc()).answers[items[i].id];
  const [walk, setWalk] = useState<Walk>(() => startWalk(items.length, done));
  const n = walk.order[walk.pos];
  const it = items[n];
  const later = laterStep(walk);
  const value = useDoc((d) => d.assess.answers?.[it.id]);
  const statement = pick(it, lang);

  const heading = useStepFocus<HTMLHeadingElement>(walk.pos);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const next = () => {
    const r = stepOn(walk, done);
    if (r === "finish") onFinish();
    else setWalk(r);
  };
  const auto = useAutoNext(walk.pos, next);
  const answer = (v: number) => {
    update((d) => void (ensureAssess(d).answers[it.id] = v), { quiet: true });
    auto();
  };
  const back = walk.pos > 0 ? () => setWalk((w) => ({ ...w, pos: w.pos - 1 })) : null;

  useDigitKeys(1, 5, (k) => {
    answer(k);
    buttons.current[k - 1]?.focus({ preventScroll: true });
  });
  const swipe = useTouchSwipe(next, back);
  useRunBack(back);

  return (
    <RunFrame
      part={part}
      step={later ?? [n + 1, items.length]}
      count={later ? t("run_later", { a: later[0], t: later[1] }) : undefined}
      swipe={swipe}
    >
      <StepIntro>
        <Context>{later ? t("run_later_p") : t(`run_${part}_ctx`)}</Context>
        {/* two lines held on phones, so the answers below do not jump between short and long statements */}
        <StepHeading ref={heading} key={it.id} className="animate-fade-in max-md:min-h-[2lh]">
          {statement}
        </StepHeading>
      </StepIntro>
      <div role="group" aria-label={statement} className="flex flex-col gap-2.5">
        {scale.map((label, i) => {
          const on = value === i + 1;
          return (
            <button
              key={i}
              ref={(el) => void (buttons.current[i] = el)}
              type="button"
              aria-pressed={on}
              onClick={() => answer(i + 1)}
              className={cn(
                "flex min-h-14.5 items-center gap-3.5 rounded-option bg-surface px-4 py-3.5 text-left text-lead transition-[box-shadow,transform] duration-150 active:scale-99",
                on ? "font-extrabold" : "font-bold",
                optionLook(on),
              )}
            >
              {on ? (
                <span
                  aria-hidden="true"
                  className="flex size-5.5 flex-none animate-fade-in items-center justify-center rounded-full bg-ink text-canvas"
                >
                  <Icon name="check" className="size-4 stroke-3" />
                </span>
              ) : (
                <span aria-hidden="true" className={cn("size-5.5 flex-none rounded-full bg-have", DOT[i])} />
              )}
              {label}
            </button>
          );
        })}
      </div>
      <ActionBar>
        <BackButton onClick={back ?? undefined} disabled={!back} />
        <PauseButton />
        <ForwardButton ready={value != null} onClick={next} />
        <AutoNextBox />
      </ActionBar>
    </RunFrame>
  );
}
