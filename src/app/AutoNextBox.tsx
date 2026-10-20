import { defineStrings, useT } from "@/i18n";
import { Checkbox } from "@/ui";
import { setAutoNext, useSettings } from "./settings";

const S = defineStrings(
  {
    auto_question: "Go to the next question automatically",
    auto_card: "Go to the next card automatically",
  },
  {
    auto_question: "Automatisch zur nächsten Frage",
    auto_card: "Automatisch zur nächsten Karte",
  },
);

/** The last row of an action bar: whether an answer goes on by itself. The label says what will happen before
 *  anything moves (WCAG 3.2.2). */
export function AutoNextBox({ what = "question" }: { what?: "question" | "card" }) {
  const t = useT(S);
  const on = useSettings((s) => s.autoNext);
  return (
    <div data-row="full">
      <Checkbox
        className="min-h-9 text-small text-ink-2"
        label={t(what === "card" ? "auto_card" : "auto_question")}
        checked={on}
        onChange={(e) => setAutoNext(e.target.checked)}
      />
    </div>
  );
}
