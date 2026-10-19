import { cn } from "@/lib/cn";

/* The logo mark: three stops on one line, (A) — (to) — (Job). The start is a ringed stop, "to" a filled one
   (on the way), the job the last stop. It stands in wherever the app needs a picture (empty, waiting and
   finished states): there is no mascot.
   state: "way" (default) the mark as it is; "waiting" the middle stop pulses (loading); "arrived" all three
   stops filled (finished). */
export type LineState = "way" | "waiting" | "arrived";

export function LineMark({
  height = 24,
  state = "way",
  className,
}: {
  /** px; the mark is 3.5 times as wide */
  height?: number;
  state?: LineState;
  className?: string;
}) {
  const arrived = state === "arrived";
  return (
    <svg
      className={cn("flex-none overflow-visible", className)}
      height={height}
      width={height * 3.5}
      viewBox="0 0 112 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="28" y="13.5" width="12" height="5" className="fill-have" />
      <rect x="62" y="13.5" width="12" height="5" className="fill-have" />
      <circle
        cx="16"
        cy="16"
        r="12.5"
        strokeWidth="5"
        className={cn("stroke-have", arrived ? "fill-have" : "fill-surface")}
      />
      <text
        x="16"
        y="21.6"
        textAnchor="middle"
        className={cn("font-display text-[15px] font-extrabold", arrived ? "fill-on-accent" : "fill-ink")}
      >
        A
      </text>
      <g
        className={
          state === "waiting" ? "[transform-origin:center] animate-stop-pulse [transform-box:fill-box]" : ""
        }
      >
        <circle cx="50" cy="16" r="15" className="fill-have" />
        <text
          x="50"
          y="20.6"
          textAnchor="middle"
          className="fill-on-accent font-display text-[13px] font-extrabold"
        >
          to
        </text>
      </g>
      <rect x="72" y="1" width="40" height="30" rx="15" className={arrived ? "fill-have" : "fill-ink"} />
      <text
        x="92"
        y="21.4"
        textAnchor="middle"
        className={cn("font-display text-[15px] font-extrabold", arrived ? "fill-on-accent" : "fill-canvas")}
      >
        Job
      </text>
    </svg>
  );
}
