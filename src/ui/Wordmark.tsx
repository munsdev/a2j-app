import { cn } from "@/lib/cn";

/** The name set as the logo: "From A to Job" with the A on an apricot tile. A placeholder until the rebrand. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold whitespace-nowrap", className)}>
      From <em className="mx-px rounded-lg bg-have-bg px-1.5 text-have-ink not-italic">A</em> to Job
    </span>
  );
}
