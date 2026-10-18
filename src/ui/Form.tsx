import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/* Form controls. 48px tall, 16px text (stops iOS from zooming in on focus), a clear border.
   Field ties a label and an optional hint to its control by id. */

const control =
  "w-full min-h-12 rounded-[13px] border-[1.5px] border-line-2 bg-surface px-3.5 py-2.5 text-[16px] text-ink transition-colors placeholder:text-ink-3 focus:border-ink-3";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(control, className)} {...rest} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }
>(function Textarea({ className, mono, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "resize-y leading-[1.45]", mono && "font-mono text-[13.5px]", className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...rest },
  ref,
) {
  return <select ref={ref} className={cn(control, "pr-9", className)} {...rest} />;
});

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** span the whole row in a FieldGrid */
  wide?: boolean;
  /** hide the label visually (still read by screen readers) */
  srLabel?: boolean;
  className?: string;
  children: (ids: { id: string; hintId?: string }) => ReactNode;
}
/** A labelled control: <Field label="Name">{(p) => <Input id={p.id} aria-describedby={p.hintId} />}</Field> */
export function Field({ label, hint, wide, srLabel, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? id + "-hint" : undefined;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", wide && "col-span-full", className)}>
      <label htmlFor={id} className={cn("text-small font-extrabold", srLabel && "sr-only")}>
        {label}
      </label>
      {children({ id, hintId })}
      {hint && (
        <span id={hintId} className="text-small text-ink-3">
          {hint}
        </span>
      )}
    </div>
  );
}

/** Fields in columns that fold to one on phones. */
export function FieldGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-3.5", className)}>
      {children}
    </div>
  );
}

/** A checkbox with its label, 40px tall. */
export function Checkbox({
  label,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("flex min-h-10 cursor-pointer items-center gap-2.5 font-bold", className)}>
      <input type="checkbox" className="size-[22px] flex-none accent-[var(--ink)]" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/** A radio choice drawn as a large card row. */
export function Choice({
  label,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[15px] bg-surface px-4 py-3.5 font-bold shadow-[inset_0_0_0_1.5px_var(--line)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--ink)]",
        className,
      )}
    >
      <input type="radio" className="size-[22px] flex-none accent-[var(--ink)]" {...rest} />
      <span>{label}</span>
    </label>
  );
}
