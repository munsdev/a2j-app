import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/* The bottom bar of a flow.
   Phones: sticky above the home indicator on a solid band (content never shows through), buttons share the
   width; a ghost button (Pause, Finish for now) takes its own row under the others on narrow screens, so long
   German labels never squeeze the main action. The bar publishes its height as --actionbar-h, so toasts sit
   above it and focused fields scroll clear of it.
   From md up: the buttons sit right-aligned at their natural size.
   A child marked data-row="full" (the "go on automatically" box) takes its own row at the bottom on
   every screen (centred on phones, under the buttons on the right from md up), so it is always in view.
   static: a bar inside a card (no sticking, no band). stretch: buttons share the width on every screen. */
export function ActionBar({
  className,
  static: isStatic,
  stretch,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { static?: boolean; stretch?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (isStatic || !el || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const set = () => {
      // only while it actually sticks to the bottom (it does on phones; on wide screens it may be static)
      const sticky = getComputedStyle(el).position === "sticky";
      root.style.setProperty("--actionbar-h", sticky ? `${el.offsetHeight}px` : "0px");
    };
    const ro = new ResizeObserver(set);
    ro.observe(el);
    set();
    return () => {
      ro.disconnect();
      root.style.removeProperty("--actionbar-h");
    };
  }, [isStatic]);
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap gap-2.5 [&>*]:min-w-0 [&>*]:flex-1 [&>*]:text-center [&>*]:whitespace-normal",
        "[&>[data-variant=ghost]]:flex-none max-sm:[&>[data-variant=ghost]]:order-last max-sm:[&>[data-variant=ghost]]:basis-full",
        "md:has-[>[data-row=full]]:flex-wrap [&>[data-row=full]]:order-last [&>[data-row=full]]:flex [&>[data-row=full]]:basis-full [&>[data-row=full]]:justify-center md:[&>[data-row=full]]:justify-end",
        isStatic
          ? "pt-3"
          : "sticky bottom-0 z-10 -mx-4 mt-auto border-t border-line bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md sm:mx-0 sm:border-0 sm:bg-[linear-gradient(to_top,var(--canvas)_80%,transparent)] sm:px-0 sm:backdrop-blur-none",
        !isStatic && !stretch && "md:flex-nowrap md:justify-end md:[&>*]:min-w-[150px] md:[&>*]:flex-none",
        className,
      )}
      {...rest}
    />
  );
}
