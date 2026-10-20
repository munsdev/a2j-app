import { useRef, type MouseEvent, type PointerEvent } from "react";

/* The job-idea deck's gestures: drag the card right for "I like it", left for "Not for me", up to skip. It
   follows the finger with a slight rotation, the container shows which way it will go (data-hint, for the
   label that fades in), and past a threshold it flies out that way; short of it, it springs back. The buttons
   and keys do the same with fling(), so every way of answering looks alike. The card has touch-action: none,
   so a vertical drag on it is the skip gesture, not a scroll (the deck fits the screen). The click that ends a
   drag must not press a chip. The card is moved straight in the DOM, so a drag never re-renders React. */

export type Fling = "left" | "right" | "up";

interface Drag {
  id: number;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  on: boolean;
  card: HTMLElement;
}

const place = (card: HTMLElement, dx: number, dy: number) => {
  card.style.translate = dx || dy ? `${dx}px ${dy}px` : "";
  card.style.rotate = dx ? `${dx / 25}deg` : "";
};

/** Handlers for the element that holds the `.card3d`, and fling(dir) for the buttons and keys. onOut runs
 *  once the card has flown out. */
export function useDeckFling(onOut: (dir: Fling) => void) {
  const drag = useRef<Drag | null>(null);
  const ate = useRef(-Infinity);
  const box = useRef<HTMLElement | null>(null);
  const busy = useRef(false);

  const hint = (h: Fling | null) => {
    const el = box.current;
    if (!el) return;
    if (h) el.dataset.hint = h;
    else delete el.dataset.hint;
  };
  const which = (dx: number, dy: number, w: number): Fling | null => {
    if (-dy > 90 && -dy > Math.abs(dx)) return "up";
    if (Math.abs(dx) > Math.min(110, w * 0.3)) return dx < 0 ? "left" : "right";
    return null;
  };
  const out = (card: HTMLElement | null, dir: Fling) => {
    if (busy.current) return;
    busy.current = true;
    hint(dir);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (card) {
      card.dataset.gone = "";
      const w = window.innerWidth + 60;
      place(card, dir === "up" ? 0 : dir === "left" ? -w : w, dir === "up" ? -window.innerHeight : 0);
    }
    setTimeout(
      () => {
        hint(null);
        busy.current = false;
        onOut(dir);
        // the same card can stay on the table (the last one, or a mark taken back): put it back in place
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!card?.isConnected) return;
            delete card.dataset.gone;
            place(card, 0, 0);
          }),
        );
      },
      still || !card ? 0 : 220,
    );
  };
  const end = (e: PointerEvent<HTMLElement>) => {
    const s = drag.current;
    if (!s || e.pointerId !== s.id) return;
    drag.current = null;
    if (!s.on) return;
    ate.current = e.timeStamp;
    delete s.card.dataset.swiping;
    const dir = e.type === "pointerup" ? which(s.dx, s.dy, s.card.offsetWidth) : null;
    if (dir) out(s.card, dir);
    else {
      hint(null);
      place(s.card, 0, 0);
    }
  };
  return {
    fling: (dir: Fling) => out(box.current?.querySelector<HTMLElement>(".card3d") ?? null, dir),
    handlers: {
      ref: (el: HTMLElement | null) => void (box.current = el),
      "data-swipe": "",
      onPointerDown(e: PointerEvent<HTMLElement>) {
        const target = e.target as HTMLElement;
        // chips may start a drag (their click is eaten afterwards); other controls keep their own gestures
        if (busy.current || e.button > 0 || target.closest("a,select,input,textarea,button:not([data-tile])"))
          return;
        const card = e.currentTarget.querySelector<HTMLElement>(".card3d");
        if (card)
          drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, on: false, card };
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const s = drag.current;
        if (!s || e.pointerId !== s.id) return;
        const dx = e.clientX - s.x0;
        const dy = Math.min(0, e.clientY - s.y0); // only up: down does nothing
        if (!s.on) {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          s.on = true;
          s.card.dataset.swiping = "";
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* capture is a nicety: without it the drag ends when the pointer leaves */
          }
        }
        s.dx = dx;
        s.dy = dy;
        place(s.card, dx, dy);
        hint(which(dx, dy, s.card.offsetWidth));
      },
      onPointerUp: end,
      onPointerCancel: end,
      onClickCapture(e: MouseEvent<HTMLElement>) {
        if (e.timeStamp - ate.current < 250) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
    },
  };
}
