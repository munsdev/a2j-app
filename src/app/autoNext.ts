import { useEffect, useRef } from "react";
import { useSettings } from "./settings";

/* "Go on automatically": after an answer (a profile question, a skill card, a job idea's thumb) the next one
   comes a moment later. On unless turned off, per device (settings.autoNext); the checkbox is AutoNextBox. */

/** How long a chosen answer stays on screen before the next one comes: long enough to see it. */
export const AUTO_NEXT_MS = 320;

/** Go on a moment after an answer, when "go on automatically" is on. Returns the function to call after an
 *  answer. A pending step is dropped when the card changes first (Back, Next) or the screen closes. */
export function useAutoNext(step: unknown, next: () => void): () => void {
  const on = useSettings((s) => s.autoNext);
  const cb = useRef(next);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    cb.current = next;
  });
  useEffect(() => () => clearTimeout(timer.current), [step]);
  return () => {
    if (!on) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => cb.current(), AUTO_NEXT_MS);
  };
}
