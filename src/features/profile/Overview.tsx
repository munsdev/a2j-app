import type { ReactNode } from "react";
import type { Doc, PartKey } from "@/data/types";
import { go } from "@/app/router";
import { useDoc } from "@/data/store";
import { PARTS, nextPart, partStatus } from "@/domain/assess";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Disclosure, Icon, Page, PageHeader, StepPills } from "@/ui";
import { partCardText } from "./logic";
import { Results } from "./Results";
import { strings } from "./strings";

/* The profile overview: six parts and what we know so far. Only the next part has a button (the one thing
   to do now); the others are whole-card links with a chevron, like the stage cards on Home. Once all six are
   done, people come back for the results: they come first and the parts fold away. */
export function Overview() {
  const t = useT(strings);
  const doc = useDoc();
  const steps = PARTS.map((k) => partStatus(doc, k).done);
  const done = steps.filter(Boolean).length;
  const all = done === PARTS.length;
  const list = <PartList doc={doc} />;
  return (
    <Page width="wide">
      <PageHeader title={t("pr_title")} lede={t(all ? "pr_lede_done" : "pr_lede")}>
        <StepPills steps={steps} label={t("of", { h: done, t: PARTS.length })} className="mt-1.5" />
      </PageHeader>
      {all ? (
        <>
          <Results />
          <Disclosure
            className="rounded-panel bg-surface px-4.5 shadow-card"
            buttonClassName="min-h-14"
            summary={
              <span className="flex items-center gap-2">
                <Icon name="check" className="text-have" />
                {t("pr_all_done")}
              </span>
            }
          >
            <div className="pb-4.5">{list}</div>
          </Disclosure>
        </>
      ) : (
        <>
          {list}
          <Results />
        </>
      )}
    </Page>
  );
}

function PartList({ doc }: { doc: Doc }) {
  const nx = nextPart(doc);
  return (
    <ol className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
      {PARTS.map((k, i) => (
        <li key={k} className="flex min-w-0">
          {k === nx ? <NextCard doc={doc} part={k} n={i + 1} /> : <PartLink doc={doc} part={k} n={i + 1} />}
        </li>
      ))}
    </ol>
  );
}

/** The number of a part, or a check once it is done. */
function Badge({ n, done, next }: { n: number; done: boolean; next?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9.5 flex-none items-center justify-center rounded-tile font-display text-title font-semibold",
        done
          ? "bg-have text-on-accent"
          : next
            ? "bg-ink text-canvas"
            : "bg-surface-2 text-ink-2 shadow-ring-soft",
      )}
    >
      {done ? <Icon name="check" className="stroke-3" /> : n}
    </span>
  );
}

/** Title, what the part is, and "status · time". */
function PartText({ doc, part, children }: { doc: Doc; part: PartKey; children?: ReactNode }) {
  const t = useT(strings);
  const s = partStatus(doc, part);
  const txt = partCardText(s);
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {children}
      <span className="font-display text-lead leading-snug font-semibold">{t(`part_${part}`)}</span>
      <span className="text-small text-ink-2">{t(`part_${part}_p`)}</span>
      <span className="mt-1 text-caption font-bold text-ink-3">
        {t(txt.status, { a: s.n ?? 0, t: s.t ?? 0 })} · {t(`part_${part}_t`)}
      </span>
    </span>
  );
}

/** The part to do now: marked "Up next", with the one primary button of the list. The button covers the
 *  whole card, so a tap anywhere on it starts the part. */
function NextCard({ doc, part, n }: { doc: Doc; part: PartKey; n: number }) {
  const t = useT(strings);
  const s = partStatus(doc, part);
  const label = t(partCardText(s).button);
  return (
    <div className="relative flex flex-1 flex-col gap-3.5 rounded-card bg-surface p-4 shadow-lift">
      <div className="flex items-start gap-3.5">
        <Badge n={n} done={s.done} next />
        <PartText doc={doc} part={part}>
          <span className="mb-1 self-start rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-extrabold text-accent-ink">
            {t("pr_next")}
          </span>
        </PartText>
      </div>
      <Button
        variant="primary"
        aria-label={`${label}: ${t(`part_${part}`)}`}
        className="mt-auto after:absolute after:inset-0 after:rounded-card"
        onClick={() => go("profile/" + part)}
      >
        {label}
        <Icon name="arrow" />
      </Button>
    </div>
  );
}

/** Any other part: the whole card is a link, its chevron says so. */
function PartLink({ doc, part, n }: { doc: Doc; part: PartKey; n: number }) {
  const s = partStatus(doc, part);
  const to = "profile/" + part;
  return (
    <a
      href={"#" + to}
      onClick={(e) => {
        e.preventDefault();
        go(to);
      }}
      className="group flex flex-1 items-start gap-3.5 rounded-card bg-surface p-4 text-ink no-underline shadow-card transition-[box-shadow,transform] duration-200 ease-out-soft hover:-translate-y-0.5 hover:shadow-lift"
    >
      <Badge n={n} done={s.done} />
      <span className="flex min-w-0 flex-1">
        <PartText doc={doc} part={part} />
      </span>
      <Icon
        name="chev"
        className="mt-2 flex-none text-ink-3 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </a>
  );
}
