import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** A section that opens and closes: a full-width button with a chevron, and the content under it. */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className,
  buttonClassName,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 py-2 text-left font-extrabold text-ink-2 hover:text-ink",
          buttonClassName,
        )}
      >
        <Icon name="chev" className={cn("size-4 transition-transform", open && "rotate-90")} />
        <span className="min-w-0 flex-1">{summary}</span>
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
