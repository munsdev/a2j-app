import { createContext, useContext, useEffect, useRef, type MutableRefObject, type TouchEvent } from "react";
import { isShortcutBlocked } from "@/lib/keys";
import { focusForStep } from "@/lib/focus";
import { digitKey, swipeDir } from "../logic";

/** Move focus to the step's heading whenever the step changes (screen readers hear the new question). */
export function useStepFocus<T extends HTMLElement>(step: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    focusForStep(ref.current);
  }, [step]);
  return ref;
}

/** Swipe left for next, right for back, on touch screens. Spread the handlers on the run's container. */
export function useTouchSwipe(onNext: (() => void) | null, onBack: (() => void) | null) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: TouchEvent) => {
      start.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dir = swipeDir(t.clientX - s.x, t.clientY - s.y);
      if (dir === "next") onNext?.();
      else if (dir === "back") onBack?.();
    },
  };
}

/** Digit keys answer the current question (1..5) or card (0..5), unless the person is typing in a field. */
export function useDigitKeys(min: number, max: number, onDigit: ((n: number) => void) | null) {
  const cb = useRef(onDigit);
  useEffect(() => {
    cb.current = onDigit;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!cb.current || isShortcutBlocked(e)) return;
      const n = digitKey(e.key, min, max);
      if (n == null) return;
      e.preventDefault();
      cb.current(n);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [min, max]);
}

/** Answers inside a run are saved quietly; leaving the run closes them into one undo step. */
export { useCommitOnLeave } from "@/data/hooks";

/** The step back of the run on screen, for phone Back (PartRun takes Back; null = leave the part). */
export const RunBack = createContext<MutableRefObject<(() => void) | null> | null>(null);
/** Give phone Back the run's own step back. */
export function useRunBack(back: (() => void) | null) {
  const ref = useContext(RunBack);
  useEffect(() => {
    if (!ref) return;
    ref.current = back;
    return () => {
      ref.current = null;
    };
  });
}

export { useAutoNext } from "@/app/autoNext";
