import { useId, useMemo, useState, type FormEvent } from "react";
import { useEscoReady } from "@/app/catalog";
import { toast } from "@/app/toast";
import { update } from "@/data/store";
import { skLabel } from "@/domain/catalog";
import { useSkillSearch } from "@/app/useCatalogSearch";
import { addOwnSkill } from "@/domain/skills";
import { useT } from "@/i18n";
import { Button, Chips, Disclosure, Hint, SuggestInput } from "@/ui";
import { guessSkill } from "../logic";
import { strings } from "../strings";

/* "Add a skill that is not on the cards", folded away under the cards: typed words become a catalogue skill
   when they match one exactly, offer close catalogue skills when there are some, or are kept as the
   person's own words. */
export function AddSkill() {
  const t = useT(strings);
  const E = useEscoReady();
  const inputId = useId();
  const [text, setText] = useState("");
  const [meant, setMeant] = useState<{ t: string; hits: number[] } | null>(null);
  const skillHits = useSkillSearch(E, text, 8);
  const suggestions = useMemo(() => skillHits.map((i) => skLabel(E, i)), [E, skillHits]);

  const add = (words: string, linkTo?: number) => {
    update((d) => void addOwnSkill(d, E, words, 3, linkTo));
    toast(t("sk_added", { x: linkTo != null ? skLabel(E, linkTo) : words }));
    setMeant(null);
    setText("");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const words = text.trim();
    if (!words) return;
    const g = guessSkill(E, words);
    if (g.kind === "meant") setMeant({ t: words, hits: g.hits });
    else add(words);
  };

  return (
    <Disclosure
      summary={t("sk_add")}
      className="rounded-card bg-surface px-3.5 shadow-card"
      buttonClassName="min-h-12"
    >
      <div className="flex flex-col gap-3 pb-3.5">
        <form onSubmit={submit} className="flex flex-wrap items-start gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t("sk_add")}
          </label>
          <SuggestInput
            id={inputId}
            value={text}
            onValueChange={(v) => {
              setText(v);
              setMeant(null);
            }}
            suggestions={suggestions}
            placeholder={t("sk_add_ph")}
            className="min-w-45 flex-1"
          />
          <Button type="submit">{t("sk_add_btn")}</Button>
        </form>
        {meant && (
          <div className="flex flex-col gap-2" role="group" aria-label={t("sk_meant")}>
            <Hint>{t("sk_meant")}</Hint>
            <Chips>
              {meant.hits.map((i) => (
                <Button
                  key={i}
                  size="sm"
                  className="rounded-full text-left whitespace-normal"
                  onClick={() => add(meant.t, i)}
                >
                  {skLabel(E, i)}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full underline"
                onClick={() => add(meant.t)}
              >
                {t("sk_keep")}
              </Button>
            </Chips>
          </div>
        )}
      </div>
    </Disclosure>
  );
}
