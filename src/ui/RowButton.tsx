import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

/* A list row that opens something: a leading icon, a title, a line of detail, extra content (chips) and a
   chevron. Used for saved courses and job ads, prompts, samples, menu sheets. danger for destructive rows. */
export const RowButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: IconName;
    lead?: ReactNode;
    title: ReactNode;
    detail?: ReactNode;
    chevron?: boolean;
    danger?: boolean;
  }
>(function RowButton(
  { icon, lead, title, detail, chevron = true, danger, className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-option bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-sunk",
        danger && "text-no",
        className,
      )}
      {...rest}
    >
      <span className="row-span-2 flex items-center [&_svg]:text-course" aria-hidden="true">
        {lead ?? (icon ? <Icon name={icon} className={danger ? "text-no!" : undefined} /> : null)}
      </span>
      <span className="flex min-w-0 flex-col">
        <b className="font-extrabold break-words">{title}</b>
        {detail && <span className="text-small text-ink-3">{detail}</span>}
      </span>
      {chevron ? <Icon name="chev" className="row-span-2 text-ink-3" /> : <span className="row-span-2" />}
      {children && <span className="col-start-2 flex flex-wrap gap-1.5">{children}</span>}
    </button>
  );
});
