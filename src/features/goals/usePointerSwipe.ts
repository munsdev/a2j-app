import { useRef, type MouseEvent, type PointerEvent } from "react";

/* Swipe a card sideways: it follows the finger with a slight rotation, and past a threshold flies out the way
   it was thrown (on job ideas: to the left for the next card, to the right for the one before). A vertical drag still scrolls the page (the card has touch-action: pan-y). The click that ends a
   swipe must not turn the card over or press a tile. The card is moved straight in the DOM, so a swipe never
   re-renders React: it stays at 60fps on slow phones. */

interface Drag {
  id: number;
  x0: number;
  y0: number;
  dx: number;
  on: boolean;
  card: HTMLElement;
}

/** Handlers for the element that holds a `.card3d`. onOut runs once the card has flown out (dir -1: thrown to
 *  the left). can(dir) false: the card does not go that way and springs back (the first card of the deck). */
export function usePointerSwipe(onOut: (dir: -1 | 1) => void, can: (dir: -1 | 1) => boolean = () => true) {
  const drag = useRef<Drag | null>(null);
  const ate = useRef(-Infinity);
  const place = (card: HTMLElement, dx: number) => {
    card.style.translate = dx ? `${dx}px 0` : "";
    card.style.rotate = dx ? `${dx / 25}deg` : "";
  };
  const end = (e: PointerEvent<HTMLElement>) => {
    const s = drag.current;
    if (!s || e.pointerId !== s.id) return;
    drag.current = null;
    if (!s.on) return;
    ate.current = e.timeStamp;
    delete s.card.dataset.swiping;
    const dir = s.dx < 0 ? -1 : 1;
    if (e.type === "pointerup" && Math.abs(s.dx) > Math.min(110, s.card.offsetWidth * 0.3) && can(dir)) {
      s.card.dataset.gone = "";
      place(s.card, dir * (window.innerWidth + 60));
      // with reduced motion the card does not fly, so there is nothing to wait for
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const card = s.card;
      setTimeout(
        () => {
          onOut(dir);
          // a card that stays on the table (side by side, going back) comes back into place once the deck has
          // moved; a card that left the table is gone by then
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (!card.isConnected) return;
              delete card.dataset.gone;
              place(card, 0);
            }),
          );
        },
        still ? 0 : 200,
      );
    } else place(s.card, 0);
  };
  return {
    "data-swipe": "",
    onPointerDown(e: PointerEvent<HTMLElement>) {
      const target = e.target as HTMLElement;
      // tiles may start a swipe (their click is eaten afterwards); other controls keep their own gestures
      if (e.button > 0 || target.closest("a,select,input,textarea,button:not([data-tile])")) return;
      const card = e.currentTarget.querySelector<HTMLElement>(".card3d");
      if (card) drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, on: false, card };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = drag.current;
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.x0;
      const dy = e.clientY - s.y0;
      if (!s.on) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          drag.current = null;
          return;
        }
        if (Math.abs(dx) < 10) return;
        s.on = true;
        s.card.dataset.swiping = "";
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* capture is a nicety: without it the swipe ends when the pointer leaves */
        }
      }
      s.dx = dx;
      place(s.card, dx);
    },
    onPointerUp: end,
    onPointerCancel: end,
    onClickCapture(e: MouseEvent<HTMLElement>) {
      if (e.timeStamp - ate.current < 250) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
