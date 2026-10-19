import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/* Chips: small rounded labels. ToggleChip is a pressable chip for multi-select choices. Tag is smaller,
   for card metadata (goal, fit, preparation level). */
const chip = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-small leading-tight font-bold no-underline [&_svg]:size-[15px]",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-ink",
        have: "bg-have-bg text-have-ink",
        course: "bg-course-bg text-course-ink",
        yes: "bg-yes-bg text-yes",
        no: "bg-transparent text-no shadow-[inset_0_0_0_1.5px_currentColor]",
        plain: "bg-surface text-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);
export type ChipTone = NonNullable<VariantProps<typeof chip>["tone"]>;

export function Chip({ tone, className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return <span className={cn(chip({ tone }), className)} {...rest} />;
}

export function ToggleChip({
  pressed,
  danger,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        chip({ tone: "plain" }),
        "min-h-10 px-3.5 shadow-[inset_0_0_0_1.5px_var(--line-2)] transition-colors",
        pressed && (danger ? "bg-no text-white shadow-none" : "bg-ink text-canvas shadow-none"),
        className,
      )}
      {...rest}
    />
  );
}

/** A row of chips that wraps. */
export function Chips({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

const tag = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-extrabold [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-ink-2",
        goal: "bg-ink text-canvas",
        like: "bg-yes-bg text-yes",
        have: "bg-have-bg text-have-ink",
        course: "bg-course-bg text-course-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);
export function Tag({
  tone,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tag>) {
  return <span className={cn(tag({ tone }), className)} {...rest} />;
}
