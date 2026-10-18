import { cn } from "@/lib/cn";

/** Have / a course covers it / still to learn, as one bar. The empty part is segmented, like tiles to fill. */
export function SkillBar({
  have,
  course,
  total,
  label,
  className,
}: {
  have: number;
  course: number;
  total: number;
  label: string;
  className?: string;
}) {
  const t = total || 1;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex h-3 overflow-hidden rounded-[6px] bg-[repeating-linear-gradient(90deg,var(--sunk)_0_10px,transparent_10px_12px)] shadow-[inset_0_0_0_1px_var(--line)]",
        className,
      )}
    >
      <span className="block h-full bg-have" style={{ width: `${(have / t) * 100}%` }} />
      <span
        className="block h-full bg-[repeating-linear-gradient(135deg,var(--course)_0_5px,color-mix(in_srgb,var(--course)_55%,var(--surface))_5px_9px)]"
        style={{ width: `${(course / t) * 100}%` }}
      />
    </div>
  );
}

/** A thin progress track for a run of questions. */
export function Track({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-[4px] bg-sunk", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span
        className="block h-full rounded-[4px] bg-have transition-[width] duration-300"
        style={{ width: `${max ? (value / max) * 100 : 0}%` }}
      />
    </div>
  );
}

/** Small pills, one per step, filled when done. */
export function StepPills({
  steps,
  label,
  size = "md",
  className,
}: {
  steps: boolean[];
  label?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-none gap-1.5", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {steps.map((on, i) => (
        <span
          key={i}
          className={cn(
            "rounded-[4px]",
            size === "lg" ? "h-2.5 w-[30px]" : "h-2 w-[22px]",
            on ? "bg-have" : "bg-line-2",
          )}
        />
      ))}
    </div>
  );
}
