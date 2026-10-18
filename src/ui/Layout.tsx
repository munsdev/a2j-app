import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Page structure. Every screen sits in the same 1100px frame, so titles and back links keep one left edge as
   people move between screens. width sets how wide the content may grow inside it: "narrow" (760px) for flows
   and forms, "medium" (960px), "wide" (the full frame) for overviews with columns. Panel is the white card
   everything sits on. */

export function Page({
  width = "narrow",
  className,
  children,
}: {
  width?: "narrow" | "medium" | "wide";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1100px] flex-col gap-[18px] px-[max(16px,env(safe-area-inset-left))] pt-[22px] pb-7",
        width === "narrow" && "[&>*]:max-w-[760px]",
        width === "medium" && "[&>*]:max-w-[960px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The title block of a screen. */
export function PageHeader({
  title,
  lede,
  children,
  className,
}: {
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-display">{title}</h1>
        {lede && <Lede>{lede}</Lede>}
        {children}
      </div>
    </header>
  );
}

export const Lede = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("max-w-[62ch] text-lead text-ink-2", className)} {...rest} />
);
/** Small grey helper text. */
export const Hint = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-small text-ink-3", className)} {...rest} />
);
/** Small caps label above a title. */
export const Eyebrow = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 text-caption font-extrabold tracking-[.08em] text-ink-3 uppercase [&_svg]:size-4",
      className,
    )}
    {...rest}
  />
);
/** A small caps sub-heading inside a panel. */
export const SubHeading = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "mt-3.5 mb-1.5 font-sans text-caption font-extrabold tracking-[.06em] text-ink-3 uppercase",
      className,
    )}
    {...rest}
  />
);

/** A surface card. tone="sunk" for a panel inside a panel or a sheet. */
export function Panel({
  as: As = "section",
  tone = "raised",
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article"; tone?: "raised" | "sunk" | "flat" }) {
  return (
    <As
      className={cn(
        "flex flex-col gap-3 rounded-panel p-[18px]",
        tone === "raised" && "bg-surface shadow-card",
        tone === "sunk" && "bg-surface-2",
        tone === "flat" && "bg-surface",
        className,
      )}
      {...rest}
    />
  );
}
/** A panel title, with an optional icon before it. */
export const PanelTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("flex items-center gap-2 text-title [&_svg]:text-ink-3", className)} {...rest} />
);

/** A row of buttons that wraps. */
export const ButtonRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-wrap items-center gap-2.5", className)} {...rest} />
);
