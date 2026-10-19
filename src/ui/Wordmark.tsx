import { cn } from "@/lib/cn";
import { LineMark } from "./LineMark";

/** The logo: the line mark, (A) — (to) — (Job), and the name. Decorative: the link around it carries the name. */
export function Wordmark({ className, height = 24 }: { className?: string; height?: number }) {
  return (
    <span className={cn("flex items-center gap-2.5 font-display font-bold whitespace-nowrap", className)}>
      <LineMark height={height} />
      <span>From A to Job</span>
    </span>
  );
}
