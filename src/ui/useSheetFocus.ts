import { useEffect, useRef } from "react";

/** Move focus into a sheet when its content appears: to the given element (a heading with tabIndex -1, or the
 *  first field of a new form). Runs a frame later, after the dialog's own focus handling, so it also works
 *  when one sheet replaces another. */
export function useSheetFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => ref.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);
  return ref;
}
