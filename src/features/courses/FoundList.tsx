import { useEffect, useRef } from "react";
import { safeUrl } from "@/data/doc";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Checkbox, Chip, Chips, ExternalLink, Hint, Icon } from "@/ui";
import { strings } from "./strings";
import type { FoundItem } from "./found";
import type { ItemKind } from "./types";

/** What the AI found, as cards to tick, with "Keep n". */
export function FoundList({
  kind,
  items,
  keep,
  onToggle,
  onKeep,
}: {
  kind: ItemKind;
  items: readonly FoundItem[];
  keep: readonly boolean[];
  onToggle: (i: number, v: boolean) => void;
  onKeep: () => void;
}) {
  const t = useT(strings);
  const course = kind === "course";
  const n = keep.filter(Boolean).length;
  const head = useRef<HTMLHeadingElement>(null);
  /* the results appear below the paste box: bring them into view (the live region announces them).
     Braces, not an expression body: newer Chrome returns a Promise from scrollIntoView, and React
     would call it as the cleanup on unmount ("is not a function"). */
  useEffect(() => {
    head.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h4 ref={head} className="scroll-mt-4 font-display text-title font-semibold">
          {t("f_found", { n: items.length })}
        </h4>
        <Hint>{t("f_found_p")}</Hint>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((x, i) => {
          const f = x.fields;
          const meta = (course ? [f.provider, f.start, f.length] : [f.org, f.place, f.deadline]).filter(
            Boolean,
          );
          const link = safeUrl(f.url);
          return (
            <li
              key={i}
              className={cn(
                "flex flex-col gap-2 rounded-option bg-surface px-3.5 py-2.5 shadow-ring-soft transition-shadow",
                keep[i] && "shadow-selected",
              )}
            >
              <Checkbox
                checked={keep[i]}
                onChange={(e) => onToggle(i, e.target.checked)}
                className="items-start [&>input]:mt-2.5"
                label={
                  <span className="flex min-w-0 flex-col gap-0.5 py-2">
                    <b className="leading-snug wrap-anywhere">{x.name}</b>
                    {meta.length > 0 && (
                      <span className="text-small font-normal text-ink-3">{meta.join(" · ")}</span>
                    )}
                  </span>
                }
              />
              {/* the link sits outside the label: tapping it must not tick the box */}
              {(x.azav === "provider" || (course && x.covers.length > 0) || link) && (
                <Chips className="gap-1.5 pb-1 pl-8">
                  {course && x.azav === "provider" && (
                    <Chip tone="yes" title={t("f_azav_tip")}>
                      {t("f_azav")}
                    </Chip>
                  )}
                  {course && x.covers.length > 0 && (
                    <Chip tone="course">
                      <Icon name="book" />
                      {t("f_covers_n", { n: x.covers.length })}
                    </Chip>
                  )}
                  {link && (
                    <ExternalLink
                      href={link}
                      className="min-h-8 rounded-full bg-surface-2 px-3 text-small font-bold text-ink underline-offset-2 hover:underline [&_svg]:size-3.75"
                    >
                      {t("open_link")}
                    </ExternalLink>
                  )}
                </Chips>
              )}
            </li>
          );
        })}
      </ul>
      {course && items.some((x) => x.azav === "provider") && (
        <p className="flex items-start gap-2 text-small text-ink-2 [&_svg]:mt-px [&_svg]:size-4.5 [&_svg]:flex-none [&_svg]:text-accent-ink">
          <Icon name="warn" />
          {t("f_azav_tip")}
        </p>
      )}
      <Button variant="primary" className="self-start" disabled={!n} onClick={onKeep}>
        <Icon name="check" />
        {t("f_keep", { n })}
      </Button>
    </>
  );
}
