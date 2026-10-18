import { create } from "zustand";

/* "Install the app": the browser's install prompt, when it offers one. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<unknown>;
}
interface InstallState {
  evt: InstallPromptEvent | null;
  installed: boolean;
}
export const useInstall = create<InstallState>(() => ({ evt: null, installed: false }));

export const isStandalone = (): boolean =>
  !!(
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone
  );
export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function initInstall(onInstalled: () => void): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstall.setState({ evt: e as InstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    useInstall.setState({ evt: null, installed: true });
    onInstalled();
  });
}
export async function doInstall(): Promise<void> {
  const e = useInstall.getState().evt;
  if (!e) return;
  useInstall.setState({ evt: null });
  try {
    await e.prompt();
    await e.userChoice;
  } catch {
    /* dismissed */
  }
}
