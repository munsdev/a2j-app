import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LineMark, type LineState } from "./LineMark";

/** An empty, waiting or finished state: the line mark, a title, a line, actions. soft=true for an inline row. */
export function EmptyState({
  state = "way",
  title,
  children,
  actions,
  soft,
  size = 32,
  titleAs: Title = "h2",
  className,
}: {
  state?: LineState;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  soft?: boolean;
  size?: number;
  /** the heading element: h1 when the empty state is the whole screen */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}) {
  if (soft)
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 rounded-panel bg-surface p-[18px] text-left text-ink-2",
          className,
        )}
      >
        <LineMark height={22} state={state} />
        <div>{children}</div>
      </div>
    );
  return (
    <div className={cn("flex flex-col items-center gap-3 px-2.5 py-8 text-center", className)}>
      <LineMark height={Math.min(size, 32)} state={state} />
      {title && <Title className="text-heading">{title}</Title>}
      {children && <div className="max-w-[52ch] text-ink-2">{children}</div>}
      {actions && <div className="flex flex-wrap justify-center gap-2.5">{actions}</div>}
    </div>
  );
}
