import { useRef, useState, type KeyboardEvent } from "react";
import { getDoc, update, useDoc } from "@/data/store";
import { ensureAssess } from "@/domain/assess";
import { RULED_GROUPS, RULED_OUT, SETTING, type SettingRow } from "@/domain/items";
import { pick, useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { ActionBar, Button, Chips, Eyebrow, Icon, Lede, ToggleChip } from "@/ui";
import { midSentence } from "../logic";
import { strings } from "../strings";
import { useAutoNext, useRunBack, useStepFocus, useTouchSwipe } from "./hooks";
import {
  AutoNextBox,
  BackButton,
  ForwardButton,
  PauseButton,
  RunFrame,
  StepHeading,
  StepIntro,
} from "./RunFrame";

/* Part 3: one two-ended scale per screen, then what is ruled out. A scale starts in the middle (either), so
   there is no separate "doesn't matter": Next keeps the middle when the dot was not moved. */
const STEPS = SETTING.length + 1;

export function SettingRun({ onFinish }: { onFinish: () => void }) {
  const t = useT(strings);
  const [pos, setPos] = useState(0);
  const heading = useStepFocus<HTMLHeadingElement>(pos);
  const row = SETTING[pos] as SettingRow | undefined;
  const value = useDoc((d) => (row ? d.assess.setting?.[row.id] : undefined)) ?? 3;

  const set = (v: number) => {
    if (row) update((d) => void (ensureAssess(d).setting[row.id] = v), { quiet: true });
  };
  const next = () => {
    if (row && !getDoc().assess.setting?.[row.id]) set(3);
    setPos((p) => Math.min(p + 1, SETTING.length));
  };
  const back = pos > 0 ? () => setPos((p) => p - 1) : null;
  const swipe = useTouchSwipe(next, back);
  useRunBack(back);
  const auto = useAutoNext(pos, next);

  if (!row)
    return (
      <RunFrame part="set" step={[STEPS, STEPS]}>
        <StepIntro>
          <StepHeading ref={heading}>{t("set_out_h")}</StepHeading>
          <Lede>{t("set_out_p")}</Lede>
        </StepIntro>
        <RuledOut />
        <ActionBar>
          <BackButton onClick={back ?? undefined} />
          <PauseButton />
          <Button variant="primary" onClick={onFinish}>
            {t("save")}
            <Icon name="check" />
          </Button>
        </ActionBar>
      </RunFrame>
    );

  return (
    <RunFrame part="set" step={[pos + 1, STEPS]} swipe={swipe}>
      <StepIntro>
        <StepHeading ref={heading}>{t("set_q")}</StepHeading>
      </StepIntro>
      <Scale
        key={row.id}
        row={row}
        value={value}
        onChange={set}
        onPick={(v) => {
          set(v);
          auto();
        }}
      />
      <ActionBar>
        <BackButton onClick={back ?? undefined} disabled={!back} />
        <PauseButton />
        <ForwardButton ready onClick={next} />
        <AutoNextBox />
      </ActionBar>
    </RunFrame>
  );
}

/* dots grow towards the ends: a strong preference is a bigger dot. The chosen dot is filled with ink and
   carries a check (the shared selected look), never the "have" colour. */
const DOT_SIZE = ["size-10", "size-7.5", "size-5.5", "size-7.5", "size-10"];

/** A five-point scale between two ends, as a radio group: arrow keys move and choose (onChange), Tab leaves; a
 *  click or tap chooses (onPick), which may go on to the next scale. */
function Scale({
  row,
  value,
  onChange,
  onPick,
}: {
  row: SettingRow;
  value: number;
  onChange: (v: number) => void;
  onPick: (v: number) => void;
}) {
  const t = useT(strings);
  const lang = useLang();
  const [left, right] = pick(row, lang);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const label = (n: number) =>
    n === 3
      ? t("set_mid")
      : t(n === 1 || n === 5 ? "res_clearly" : "res_rather", { x: midSentence(n < 3 ? left : right, lang) });
  const onKey = (e: KeyboardEvent, n: number) => {
    const d =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!d) return;
    e.preventDefault();
    const m = Math.min(5, Math.max(1, n + d));
    onChange(m);
    refs.current[m - 1]?.focus();
  };
  return (
    <div className="animate-fade-in rounded-panel bg-surface px-4.5 pt-5 pb-3.5 shadow-card">
      <div
        className="mb-3.5 flex justify-between gap-5 font-display text-title font-semibold"
        aria-hidden="true"
      >
        <span>{left}</span>
        <span className="text-right">{right}</span>
      </div>
      <div
        role="radiogroup"
        aria-label={`${left} / ${right}`}
        className="relative flex items-center justify-between before:absolute before:inset-x-6 before:top-1/2 before:-mt-0.5 before:h-1 before:rounded-full before:bg-sunk"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              ref={(el) => void (refs.current[n - 1] = el)}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={label(n)}
              tabIndex={on ? 0 : -1}
              onClick={() => onPick(n)}
              onKeyDown={(e) => onKey(e, n)}
              className="group relative flex size-12 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex items-center justify-center rounded-full transition-[transform,background-color,box-shadow] duration-150",
                  DOT_SIZE[n - 1],
                  on
                    ? "scale-108 bg-ink text-canvas"
                    : "bg-surface shadow-ring group-hover:shadow-ring-strong",
                )}
              >
                {on && <Icon name="check" className={cn("stroke-3", n === 3 ? "size-3.5" : "size-4.5")} />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-center text-caption font-bold text-ink-3" aria-hidden="true">
        {t("set_mid")}
      </p>
    </div>
  );
}

/** What is ruled out: four groups of toggle chips. Saved as they are pressed. */
function RuledOut() {
  const t = useT(strings);
  const lang = useLang();
  const out = useDoc((d) => d.assess.ruledOut);
  const toggle = (id: string) =>
    update(
      (d) => {
        const a = ensureAssess(d);
        const i = a.ruledOut.indexOf(id);
        if (i >= 0) a.ruledOut.splice(i, 1);
        else a.ruledOut.push(id);
      },
      { quiet: true },
    );
  return (
    <div className="flex flex-col gap-5">
      {RULED_GROUPS.map((g) => (
        <fieldset key={g} className="flex flex-col gap-2.5">
          <legend className="mb-2.5">
            <Eyebrow>{t(`out_g_${g}`)}</Eyebrow>
          </legend>
          <Chips>
            {RULED_OUT.filter((o) => o.g === g).map((o) => {
              const on = !!out?.includes(o.id);
              return (
                <ToggleChip key={o.id} pressed={on} danger onClick={() => toggle(o.id)}>
                  {pick(o, lang)}
                </ToggleChip>
              );
            })}
          </Chips>
        </fieldset>
      ))}
    </div>
  );
}
