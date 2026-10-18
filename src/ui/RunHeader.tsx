import type { ReactNode } from "react";
import { useT } from "@/i18n";
import { Icon } from "./Icon";
import { IconButton } from "./Button";
import { Track } from "./Progress";

/* The header of a flow or a sub-screen: a back button, where you are, an optional count and track.
   With a title (sub-screens: the job page, compare, job ideas) the eyebrow is the way back ("Goals") and the
   title is the screen's h1 at display size. Without one (the steps of a run), the eyebrow is the h1, kept
   small so the question below gets the attention. */
export function RunHeader({
  onBack,
  backLabel,
  eyebrow,
  title,
  count,
  progress,
  end,
}: {
  onBack: () => void;
  backLabel?: string;
  eyebrow: ReactNode;
  title?: ReactNode;
  /** "3 of 45" */
  count?: string;
  progress?: { value: number; max: number };
  /** something at the right end (a filter, a menu button) */
  end?: ReactNode;
}) {
  const t = useT();
  const eyebrowCls =
    "m-0 block min-w-0 font-sans text-caption font-extrabold tracking-[.08em] text-ink-3 uppercase";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <IconButton onClick={onBack} aria-label={backLabel ?? t("back")} className="-ml-2.5">
          <Icon name="back" />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2.5">
          {title ? <span className={eyebrowCls}>{eyebrow}</span> : <h1 className={eyebrowCls}>{eyebrow}</h1>}
          {count && (
            <span className="text-small font-extrabold whitespace-nowrap text-ink-3 tabular-nums">
              {count}
            </span>
          )}
        </div>
        {end}
      </div>
      {title && <h1 className="-mt-1 text-display break-words hyphens-auto">{title}</h1>}
      {progress && <Track value={progress.value} max={progress.max} />}
    </div>
  );
}
