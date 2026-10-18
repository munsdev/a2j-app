import { useId } from "react";
import { cn } from "@/lib/cn";
import { Mascot } from "@/ui/Mascot";

/* The picture next to the welcome: the guide hops from A over skill tiles (two you have, one a course covers,
   two to learn) to the job flag. One SVG, so it stays crisp at every size; colours come from the tokens, so it
   follows dark mode. Decorative: hidden from screen readers. */

const S = 44; // tile size
const W = 400;
const H = 196;
const TILES = [
  { k: "a", x: 32, y: 164 },
  { k: "have", x: 88, y: 140 },
  { k: "have", x: 144, y: 116 },
  { k: "course", x: 200, y: 126 },
  { k: "learn", x: 256, y: 138 },
  { k: "learn", x: 312, y: 102 },
  { k: "job", x: 368, y: 58 },
] as const;

/* a hop from tile to tile: up and over, landing on the next one */
const TRAIL = TILES.slice(1)
  .map((b, i) => {
    const a = TILES[i];
    const mx = (a.x + b.x) / 2;
    const my = Math.min(a.y, b.y) - 36;
    return `${i ? "" : `M${a.x} ${a.y}`} Q${mx} ${my} ${b.x} ${b.y}`;
  })
  .join(" ");

/* the icons, drawn on the same 24px grid as the icon set */
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const BOOK = "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5";
const FLAG = "M5 21V4M5 4h11l-2 4 2 4H5";

function Glyph({ d, x, y, className }: { d: string; x: number; y: number; className: string }) {
  const k = 0.95; // 24px grid → about 23px on a 44px tile
  return (
    <path
      d={d}
      transform={`translate(${x - 12 * k} ${y - 12 * k}) scale(${k})`}
      className={cn("fill-none [stroke-width:2.7] [stroke-linecap:round] [stroke-linejoin:round]", className)}
    />
  );
}

export function HeroArt({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const guide = TILES[2];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("hart block h-auto w-full overflow-visible", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" className="[stop-color:var(--accent-soft)] [stop-opacity:0.9]" />
          <stop offset="0.55" className="[stop-color:var(--accent-soft)] [stop-opacity:0.35]" />
          <stop offset="1" className="[stop-color:var(--accent-soft)] [stop-opacity:0]" />
        </radialGradient>
        <mask id={`${id}-trail`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <path
            d={TRAIL}
            pathLength={1}
            className="trail-reveal fill-none stroke-white [stroke-width:8] [stroke-linecap:round]"
          />
        </mask>
      </defs>

      {/* a warm light behind the way */}
      <ellipse
        cx={W / 2}
        cy={H / 2 + 12}
        rx={W / 2 + 20}
        ry={H / 2 + 8}
        fill={`url(#${id}-glow)`}
        className="dark:opacity-45"
      />

      {/* the dotted trail, drawn in from the start */}
      <path
        d={TRAIL}
        mask={`url(#${id}-trail)`}
        className="fill-none stroke-learn [stroke-width:3.2] opacity-70 [stroke-dasharray:0.1_9] [stroke-linecap:round]"
      />

      {TILES.map((t, i) => {
        const x = t.x - S / 2;
        const y = t.y - S / 2;
        return (
          <g key={i} className="tile" style={{ ["--i" as string]: i }}>
            {t.k === "a" && (
              <>
                <rect x={x} y={y} width={S} height={S} rx={11} className="fill-ink" />
                {/* 21px in the picture's own units (it scales with the SVG), not a type step */}
                <text
                  x={t.x}
                  y={t.y + 7.5}
                  textAnchor="middle"
                  className="fill-canvas font-display text-[21px] font-semibold"
                >
                  A
                </text>
              </>
            )}
            {t.k === "have" && (
              <>
                <rect x={x} y={y} width={S} height={S} rx={11} className="fill-have" />
                <Glyph d={CHECK} x={t.x} y={t.y} className="stroke-on-accent" />
              </>
            )}
            {t.k === "course" && (
              <>
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={S - 2}
                  height={S - 2}
                  rx={10}
                  className="fill-course-bg stroke-course [stroke-width:2]"
                />
                <Glyph d={BOOK} x={t.x} y={t.y - 0.5} className="stroke-course-ink [stroke-width:2.2]" />
              </>
            )}
            {t.k === "learn" && (
              <rect
                x={x + 1}
                y={y + 1}
                width={S - 2}
                height={S - 2}
                rx={10}
                className="fill-surface stroke-learn [stroke-width:2] [stroke-dasharray:5_4]"
              />
            )}
            {t.k === "job" && (
              <>
                <rect x={x} y={y} width={S} height={S} rx={11} className="fill-ink" />
                <g className="flag-wave">
                  <Glyph d={FLAG} x={t.x + 0.5} y={t.y} className="stroke-have" />
                </g>
              </>
            )}
          </g>
        );
      })}

      {/* the guide, standing on the last tile the person has */}
      <g transform={`translate(${guide.x - 26} ${guide.y - S / 2 - 49})`}>
        <g className="guide-hop">
          <g className="guide-idle">
            <Mascot size={52} mood="wink" />
          </g>
        </g>
      </g>
    </svg>
  );
}
