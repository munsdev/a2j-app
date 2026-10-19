import { cn } from "@/lib/cn";

/* The picture next to the welcome: a line from A to the job. Two stops behind (filled, brick), "You are
   here", a stop a course covers (ringed in course blue), two still to learn (dashed rings), and the job as
   the last stop. The ground covered is solid brick, the rest grey track. One SVG, so it stays crisp at every
   size; colours come from the tokens, so it follows dark mode. Decorative: hidden from screen readers. */

const W = 400;
const H = 180;
const Y1 = 132; // the line before the bend
const Y2 = 88; // and after it
const HERE = 152; // where you are, on the lower stretch
const BEND = 168;

/* the icons, drawn on the same 24px grid as the icon set */
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const PERSON = "M12 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7";

function Glyph({ d, x, y, k, className }: { d: string; x: number; y: number; k: number; className: string }) {
  return (
    <path
      d={d}
      transform={`translate(${x - 12 * k} ${y - 12 * k}) scale(${k})`}
      className={cn("fill-none [stroke-linecap:round] [stroke-linejoin:round]", className)}
    />
  );
}

const STOPS = [
  { k: "have", x: 76, y: Y1 },
  { k: "have", x: 116, y: Y1 },
  { k: "course", x: 220, y: Y2 },
  { k: "learn", x: 266, y: Y2 },
  { k: "learn", x: 310, y: Y2 },
] as const;

export function HeroArt({ here, className }: { here: string; className?: string }) {
  const pillW = 64 + here.length * 7.4;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("hart block h-auto w-full overflow-visible", className)}
      aria-hidden="true"
      focusable="false"
    >
      {/* the track still ahead, then the ground covered on top of it */}
      <path
        d={`M${HERE} ${Y1} H${BEND} L${BEND + Y1 - Y2} ${Y2} H352`}
        className="fill-none stroke-line-2 [stroke-width:8] [stroke-linejoin:round]"
      />
      <path
        d={`M30 ${Y1} H${HERE}`}
        pathLength={1}
        className="hart-lit fill-none stroke-have [stroke-width:8] [stroke-linecap:round]"
      />

      {/* A: the start */}
      <g className="hart-stop" style={{ ["--i" as string]: 0 }}>
        <circle cx={30} cy={Y1} r={17} className="fill-surface stroke-have [stroke-width:6]" />
        {/* 17px in the picture's own units (it scales with the SVG), not a type step */}
        <text
          x={30}
          y={Y1 + 6}
          textAnchor="middle"
          className="fill-ink font-display text-[17px] font-extrabold"
        >
          A
        </text>
      </g>

      {STOPS.map((s, i) => (
        <g key={i} className="hart-stop" style={{ ["--i" as string]: i + (s.k === "have" ? 1 : 2) }}>
          {s.k === "have" && (
            <>
              <circle cx={s.x} cy={s.y} r={12} className="fill-have" />
              <Glyph d={CHECK} x={s.x} y={s.y} k={0.62} className="stroke-on-accent [stroke-width:4.2]" />
            </>
          )}
          {s.k === "course" && (
            <circle cx={s.x} cy={s.y} r={11} className="fill-course-bg stroke-course [stroke-width:5]" />
          )}
          {s.k === "learn" && (
            <circle
              cx={s.x}
              cy={s.y}
              r={10.5}
              className="fill-surface stroke-learn [stroke-width:3] [stroke-dasharray:4.5_3.6]"
            />
          )}
        </g>
      ))}

      {/* the job: the last stop */}
      <g className="hart-stop" style={{ ["--i" as string]: 7 }}>
        <rect x={340} y={Y2 - 17} width={52} height={34} rx={17} className="fill-ink" />
        <text
          x={366}
          y={Y2 + 5.5}
          textAnchor="middle"
          className="fill-canvas font-display text-[16px] font-extrabold"
        >
          Job
        </text>
      </g>

      {/* you are here: an ink pill over the line, pointing at where the ground covered ends */}
      <g className="hart-here">
        <circle cx={HERE} cy={Y1} r={5} className="fill-ink" />
        <path d={`M${HERE} 60 V${Y1 - 4}`} className="stroke-ink [stroke-width:2.5]" />
        <rect x={HERE - pillW / 2} y={34} width={pillW} height={34} rx={17} className="fill-ink" />
        <circle cx={HERE - pillW / 2 + 19} cy={51} r={12} className="fill-have" />
        <Glyph
          d={PERSON}
          x={HERE - pillW / 2 + 19}
          y={51}
          k={0.6}
          className="stroke-on-accent [stroke-width:3.2]"
        />
        <text x={HERE - pillW / 2 + 38} y={56} className="fill-canvas font-sans text-[14px] font-bold">
          {here}
        </text>
      </g>
    </svg>
  );
}
