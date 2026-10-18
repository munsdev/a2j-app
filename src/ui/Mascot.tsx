import { cn } from "@/lib/cn";

/* The little guide: a round apricot friend. A placeholder until the new brand identity lands;
   every use goes through this component, so swapping the character is a one-file change. */
export type Mood = "" | "wink" | "think" | "yay";

export function Mascot({
  size = 40,
  mood = "",
  className,
}: {
  size?: number;
  mood?: Mood;
  className?: string;
}) {
  const line = "fill-none stroke-on-accent [stroke-width:1.5] [stroke-linecap:round]";
  return (
    <svg
      className={cn("flex-none overflow-visible", className)}
      width={size}
      height={size}
      viewBox="0 0 26 26"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="fill-have"
        d="M13 2.2c6.2 0 11 4.6 11 10.9S19.4 24 13 24 2 19.6 2 13.1 6.8 2.2 13 2.2z"
      />
      <ellipse className="fill-cheek opacity-75" cx="6.6" cy="15.6" rx="1.7" ry="1.1" />
      <ellipse className="fill-cheek opacity-75" cx="19.4" cy="15.6" rx="1.7" ry="1.1" />
      {mood === "wink" ? (
        <>
          <circle cx="9.6" cy="12" r="1.55" className="fill-on-accent" />
          <path d="M14.8 12.1h3" className={line} />
        </>
      ) : mood === "yay" ? (
        <path d="M8.2 12.4q1.4-1.6 2.8 0M14.8 12.4q1.4-1.6 2.8 0" className={line} />
      ) : (
        <>
          <circle cx="9.6" cy="12" r="1.55" className="fill-on-accent" />
          <circle cx="16.4" cy="12" r="1.55" className="fill-on-accent" />
        </>
      )}
      {mood === "think" ? (
        <path d="M11.2 16.6h3.6" className={line} />
      ) : (
        <path d="M10.3 15.8c1.5 1.4 3.9 1.4 5.4 0" className={line} />
      )}
    </svg>
  );
}
