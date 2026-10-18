import type { Doc } from "@/data/types";
import { update, useDoc } from "@/data/store";
import { aptScore, assessOf, band, ensureAssess, rawScore } from "@/domain/assess";
import { APTITUDES, APT_GROUPS, type Aptitude } from "@/domain/items";
import { pick, useLang, useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon, LinkButton, SubHeading } from "@/ui";
import { BANDS } from "./constants";
import { dotFill } from "./logic";
import { strings } from "./strings";

/* All 15 aptitudes by group, each with its dots. Open one to read what it means and to change the level
   when the answers do not fit; "use my answers" goes back to the score from the answers. */
export function AptitudeList() {
  const lang = useLang();
  const doc = useDoc();
  return (
    <div className="flex flex-col">
      {APT_GROUPS.map((g) => (
        <div key={g.id}>
          <SubHeading>{pick(g, lang)}</SubHeading>
          {APTITUDES.filter((x) => x.g === g.id).map((x) => (
            <AptRow key={x.id} doc={doc} apt={x} />
          ))}
        </div>
      ))}
    </div>
  );
}

function AptRow({ doc, apt }: { doc: Doc; apt: Aptitude }) {
  const t = useT(strings);
  const lang = useLang();
  const [name, desc] = pick(apt, lang);
  const s = aptScore(doc, apt.id);
  if (s == null)
    return (
      <div className="flex min-h-11 items-center justify-between gap-2.5 border-t border-line py-2 text-ink-3">
        <span>{name}</span>
        <span className="text-small">{t("st_todo")}</span>
      </div>
    );
  const raw = rawScore(doc, apt.id);
  const adjusted = (assessOf(doc).adjusted[apt.id] ?? 0) >= 1;
  const level = Math.round(s);
  const bands = pick(BANDS, lang);
  const adjust = (l: number) =>
    update((d) => {
      const a = ensureAssess(d);
      if (rawScore(d, apt.id) === l) delete a.adjusted[apt.id];
      else a.adjusted[apt.id] = l;
    });
  return (
    <details className="group/row border-t border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2.5 py-2 font-bold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <Icon
            name="chev"
            className="size-4 text-ink-3 transition-transform duration-200 group-open/row:rotate-90"
          />
          {name}
        </span>
        <Dots score={s} />
        <span className="sr-only">: {bands[band(s)]}</span>
      </summary>
      <div className="flex flex-col gap-2 pb-3 pl-5.5 text-small text-ink-2">
        <p>{desc}</p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-ink-3">{t("res_fit")}</span>
          <span className="-mx-1.5 flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={level === i}
                aria-label={`${name}: ${bands[i - 1]}`}
                onClick={() => adjust(i)}
                className="group/lvl flex size-11 items-center justify-center rounded-full"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-6.5 rounded-full border-2 transition-colors",
                    level >= i
                      ? "border-have bg-have"
                      : "border-line-2 bg-surface group-hover/lvl:border-ink-3",
                  )}
                />
              </button>
            ))}
          </span>
        </div>
        {adjusted && (
          <p className="text-ink-3">
            {raw != null && t("res_changed", { b: bands[band(raw)] }) + " "}
            <LinkButton
              className="inline py-0"
              onClick={() => update((d) => void delete ensureAssess(d).adjusted[apt.id])}
            >
              {t("res_reset")}
            </LinkButton>
          </p>
        )}
      </div>
    </details>
  );
}

/** Five dots for a 1..5 score, with halves. */
function Dots({ score }: { score: number }) {
  return (
    <span aria-hidden="true" className="inline-flex flex-none gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const f = dotFill(score, i);
        return (
          <i
            key={i}
            className={cn(
              "size-2.75 rounded-full",
              f === "on"
                ? "bg-have"
                : f === "half"
                  ? // a half dot: one-off, no utility draws two tokens side by side
                    "bg-[linear-gradient(90deg,var(--have)_50%,var(--line-2)_50%)]"
                  : "bg-line-2",
            )}
          />
        );
      })}
    </span>
  );
}
