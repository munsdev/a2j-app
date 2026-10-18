/* localStorage and sessionStorage that never throw. Private windows, blocked site data and full storage
   all make the accessors throw; the app must keep working (with a warning) when they do. */

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const storage = {
  get: (k: string): string | null => safe(() => localStorage.getItem(k), null),
  set: (k: string, v: string): void => safe(() => localStorage.setItem(k, v), undefined),
  remove: (k: string): void => safe(() => localStorage.removeItem(k), undefined),
  /** write and read back: false when the browser does not keep it */
  setChecked: (k: string, v: string): boolean =>
    safe(() => {
      localStorage.setItem(k, v);
      return localStorage.getItem(k) === v;
    }, false),
  probe: (): boolean =>
    safe(() => {
      localStorage.setItem("a2j:probe", "1");
      localStorage.removeItem("a2j:probe");
      return true;
    }, false),
  /** every key of this app, for Delete all data */
  removeAppKeys: (): void =>
    safe(() => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("a2j:")) localStorage.removeItem(k);
      }
    }, undefined),
};

export const session = {
  get: (k: string): string | null => safe(() => sessionStorage.getItem(k), null),
  set: (k: string, v: string): void => safe(() => sessionStorage.setItem(k, v), undefined),
  remove: (k: string): void => safe(() => sessionStorage.removeItem(k), undefined),
  clear: (): void => safe(() => sessionStorage.clear(), undefined),
};
