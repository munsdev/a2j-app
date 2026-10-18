import { useCallback, useEffect, useRef, useState } from "react";

/** Two-step confirm for destructive buttons: the first press arms (show "Tap again to delete"), the second
 *  within four seconds confirms. Returns [armed, press]; press() is true when confirmed. */
export function useArmed(ms = 4000): [boolean, () => boolean] {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const press = useCallback(() => {
    clearTimeout(timer.current);
    if (armed) {
      setArmed(false);
      return true;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), ms);
    return false;
  }, [armed, ms]);
  return [armed, press];
}
