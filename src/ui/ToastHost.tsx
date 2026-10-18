import { useRef, useState } from "react";
import { hideToast, holdToast, useToastStore } from "@/app/toast";
import { performUndo } from "@/app/history";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

/* The toast: swipe sideways or down, or tap, to dismiss it on a touch screen. */
export function ToastHost() {
  const { msg, bad, undo, visible, id } = useToastStore();
  const t = useT();
  const start = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, on: false });
  const [fly, setFly] = useState({ x: 0, y: 0 });

  const end = (e: React.PointerEvent) => {
    if (!start.current) return;
    start.current = null;
    const { x, y } = drag;
    const tap = Math.abs(x) < 6 && y < 6 && e.type === "pointerup";
    setDrag({ x: 0, y: 0, on: false });
    if (Math.abs(x) > 50 || y > 30 || tap) {
      const el = e.currentTarget as HTMLElement;
      setFly(
        Math.abs(x) > Math.abs(y)
          ? { x: Math.sign(x) * (el.offsetWidth + 40), y: 0 }
          : { x: 0, y: y > 0 ? el.offsetHeight + 40 : 0 },
      );
      hideToast();
    } else holdToast(false);
  };
  const tx = drag.on ? drag.x : visible ? 0 : fly.x;
  const ty = drag.on ? drag.y : visible ? 0 : fly.y || 20;
  return (
    <>
      {/* announced from a region that is always in the page: screen readers often skip a region that
          appears already filled */}
      <div className="sr-only" role={bad ? "alert" : "status"} aria-live={bad ? "assertive" : "polite"}>
        {visible ? msg : ""}
      </div>
      <div
        key={id}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button") || !visible) return;
          start.current = { x: e.clientX, y: e.clientY };
          setFly({ x: 0, y: 0 });
          holdToast(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          setDrag({ x: e.clientX - start.current.x, y: Math.max(0, e.clientY - start.current.y), on: true });
        }}
        onPointerUp={end}
        onPointerCancel={end}
        style={{ "--tx": `${tx}px`, "--ty": `${ty}px` } as React.CSSProperties}
        className={cn(
          "fixed bottom-[calc(max(var(--actionbar-h,0px),env(safe-area-inset-bottom))+16px)] left-1/2 z-[60] flex max-w-[min(92vw,480px)] cursor-grab touch-none items-center gap-3 rounded-[15px] px-4 py-3 text-[0.9rem] font-bold shadow-lift select-none",
          "translate-x-[calc(-50%+var(--tx))] translate-y-[var(--ty)] md:right-6 md:bottom-[calc(var(--actionbar-h,0px)+24px)] md:left-auto md:translate-x-[var(--tx)]",
          bad ? "bg-no text-white" : "bg-ink text-canvas",
          drag.on ? "cursor-grabbing transition-none" : "transition-[opacity,translate] duration-200",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span aria-hidden="true">{msg}</span>
        {undo && (
          <button
            type="button"
            className="rounded-[10px] bg-have px-3 py-1.5 font-extrabold text-on-accent"
            onClick={() => {
              hideToast();
              performUndo();
            }}
          >
            {t("undo")}
          </button>
        )}
      </div>
    </>
  );
}
