import { useRef, useState, type ReactNode } from "react";
import { useEscoReady } from "@/app/catalog";
import { go } from "@/app/router";
import { getDoc, update, useDoc } from "@/data/store";
import { isKnowledge, skLabel } from "@/domain/catalog";
import { buildDeck } from "@/domain/skills";
import { useT } from "@/i18n";
import { ActionBar, Button, Eyebrow, Hint, Icon, LevelPicker, Mascot, type Mood } from "@/ui";
import { strings } from "../strings";
import { AddSkill } from "./AddSkill";
import { useDigitKeys, useStepFocus, useTouchSwipe } from "./hooks";
import { BackButton, Context, ForwardButton, PauseButton, RunFrame, StepHeading } from "./RunFrame";

/* Part 6: the skills of the jobs done, one card at a time, rated 0 to 5 with the kit's LevelPicker (arrow
   keys inside it, digit keys 0..5 anywhere). The deck is built once per visit from the cards not rated yet,
   so rating a card does not make it vanish; Back walks the cards seen, also from the end of the deck.
   The bar keeps the run's three slots; on the cards the ghost slot is "Finish for now". */
export function SkillsRun({ onFinish }: { onFinish: () => void }) {
  const t = useT(strings);
  const E = useEscoReady();
  const [deck, setDeck] = useState(() => buildDeck(getDoc(), E));
  const [pos, setPos] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  const hasJobs = useDoc((d) => d.jobs.some((j) => j.role === "done" && j.occ != null && j.occ >= 0));
  const more = useDoc((d) => d.esco.more);
  const s = deck.cards[pos] as number | undefined;
  const value = useDoc((d) => (s != null ? d.esco.rated[s] : undefined));
  const heading = useStepFocus<HTMLHeadingElement>(hasJobs ? (s ?? "end") : "none");
  const picker = useRef<HTMLDivElement>(null);

  const rate = (n: number) => {
    if (s == null) return;
    update((d) => void (d.esco.rated[s] = n), { quiet: true });
  };
  const next =
    s != null
      ? () => {
          setSeen((h) => [...h, pos]);
          setPos(pos + 1);
        }
      : null;
  const back = seen.length
    ? () => {
        setPos(seen[seen.length - 1]);
        setSeen((h) => h.slice(0, -1));
      }
    : null;
  useDigitKeys(
    0,
    5,
    hasJobs && s != null
      ? (n) => {
          rate(n);
          picker.current?.querySelectorAll<HTMLElement>("[role=radio]")[n]?.focus({ preventScroll: true });
        }
      : null,
  );
  const swipe = useTouchSwipe(next, back);

  const done = (
    <Button variant="primary" onClick={onFinish}>
      {t("done")}
      <Icon name="check" />
    </Button>
  );

  if (!hasJobs)
    return (
      <RunFrame part="skills">
        <RunEmpty
          mood="think"
          heading={
            <StepHeading ref={heading} className="text-heading">
              {t("sk_nojobs_h")}
            </StepHeading>
          }
          text={t("sk_nojobs_p")}
          action={
            <Button variant="primary" onClick={() => go("profile/story")}>
              {t("part_story")}
              <Icon name="arrow" />
            </Button>
          }
        />
        <AddSkill />
        <ActionBar>
          <BackButton disabled />
          <PauseButton />
          {done}
        </ActionBar>
      </RunFrame>
    );

  if (s == null)
    return (
      <RunFrame part="skills">
        <RunEmpty
          mood="yay"
          heading={
            <StepHeading ref={heading} className="text-heading">
              {t("sk_all_rated")}
            </StepHeading>
          }
          action={
            !more && (
              <Button
                onClick={() => {
                  update((d) => void (d.esco.more = true));
                  setDeck(buildDeck(getDoc(), E));
                  setPos(0);
                  setSeen([]);
                }}
              >
                <Icon name="cards" />
                {t("sk_more_cards")}
              </Button>
            )
          }
        />
        <AddSkill />
        <ActionBar>
          <BackButton onClick={back ?? undefined} disabled={!back} />
          <PauseButton />
          {done}
        </ActionBar>
      </RunFrame>
    );

  const sources = [...new Set(deck.from[s] || [])];
  return (
    <RunFrame part="skills" step={[pos + 1, deck.cards.length]} swipe={swipe}>
      <div
        key={s}
        className="flex animate-deal-in flex-col items-center gap-2 rounded-panel border-t-6 border-have bg-surface px-5.5 py-6.5 text-center shadow-lift"
      >
        <Eyebrow>{t(isKnowledge(E, s) ? "sk_knowledge" : "sk_skill")}</Eyebrow>
        <StepHeading ref={heading} className="min-h-[1lh] text-heading md:text-display">
          {skLabel(E, s)}
        </StepHeading>
        {sources.length > 0 && <Hint>{t("sk_from", { x: sources.join(", ") })}</Hint>}
      </div>
      <div ref={picker} className="flex flex-col gap-2.5">
        <Context aria-hidden="true" className="font-bold text-ink">
          {t("sk_q")}
        </Context>
        <LevelPicker value={value ?? null} onChange={rate} label={t("sk_q")} hint />
      </div>
      <AddSkill />
      <ActionBar>
        <BackButton onClick={back ?? undefined} disabled={!back} />
        <PauseButton label={t("sk_finish")} onClick={onFinish} />
        <ForwardButton ready={value != null} onClick={() => next?.()} />
      </ActionBar>
    </RunFrame>
  );
}

/** An empty or finished deck: the guide, the (focused) heading, a line, one action. Not the kit's
 *  EmptyState, because the heading here must take the step's focus ref. */
function RunEmpty({
  mood,
  heading,
  text,
  action,
}: {
  mood: Mood;
  heading: ReactNode;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center gap-3 px-2.5 py-8 text-center">
      <Mascot size={64} mood={mood} />
      {heading}
      {text && <p className="max-w-[52ch] text-ink-2">{text}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2.5">{action}</div>}
    </div>
  );
}
