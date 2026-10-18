import { useRef, useState } from "react";
import { getDoc, update, useDoc } from "@/data/store";
import { assessOf, ensureAssess } from "@/domain/assess";
import { APT_ITEMS, FREQ, INT_ITEMS, LIKE } from "@/domain/items";
import { pick, useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { ActionBar, Icon } from "@/ui";
import { advance, startPos, type QuestionPos } from "../logic";
import { optionLook } from "../constants";
import { strings } from "../strings";
import { useDigitKeys, useStepFocus, useTouchSwipe } from "./hooks";
import {
  BackButton,
  Context,
  ForwardButton,
  PauseButton,
  RunFrame,
  StepHeading,
  StepIntro,
} from "./RunFrame";

/* Parts 1 and 2: one statement per screen, five answers. Choosing saves quietly and stays on the question;
   Next (or a swipe left) moves on. At the end the run goes back once to what was skipped, then finishes.
   Each answer starts with a dot that grows stronger along the scale; the chosen one gets the shared selected
   treatment (ink ring, a check in place of its dot, bolder words), so it never reads as hover or focus. */
const DOT = ["opacity-18", "opacity-35", "opacity-55", "opacity-78", "opacity-100"];

export function QuestionRun({ part, onFinish }: { part: "apt" | "int"; onFinish: () => void }) {
  const t = useT(strings);
  const lang = useLang();
  const items = part === "apt" ? APT_ITEMS : INT_ITEMS;
  const scale = pick(part === "apt" ? FREQ : LIKE, lang);
  const [cur, setCur] = useState<QuestionPos>(() => ({
    pos: startPos(items, assessOf(getDoc()).answers),
    wrapped: false,
  }));
  const it = items[cur.pos];
  const value = useDoc((d) => d.assess.answers?.[it.id]);
  const statement = pick(it, lang);

  const heading = useStepFocus<HTMLHeadingElement>(cur.pos);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const answer = (v: number) => update((d) => void (ensureAssess(d).answers[it.id] = v), { quiet: true });
  const next = () => {
    const r = advance(cur, items, assessOf(getDoc()).answers);
    if (r === "finish") onFinish();
    else setCur(r);
  };
  const back = cur.pos > 0 ? () => setCur((c) => ({ ...c, pos: c.pos - 1 })) : null;

  useDigitKeys(1, 5, (n) => {
    answer(n);
    buttons.current[n - 1]?.focus({ preventScroll: true });
  });
  const swipe = useTouchSwipe(next, back);

  return (
    <RunFrame part={part} step={[cur.pos + 1, items.length]} swipe={swipe}>
      <StepIntro>
        <Context>{t(`run_${part}_ctx`)}</Context>
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
      </ActionBar>
    </RunFrame>
  );
}
