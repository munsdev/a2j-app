import { create } from "zustand";

/* Short messages at the bottom (phones) or bottom right (computers). After a destructive action the toast
   carries an Undo button for a few seconds: phones have no Ctrl+Z. */
export interface ToastState {
  id: number;
  msg: string;
  bad: boolean;
  undo: boolean;
  visible: boolean;
}
export const useToastStore = create<ToastState>(() => ({
  id: 0,
  msg: "",
  bad: false,
  undo: false,
  visible: false,
}));

let timer: ReturnType<typeof setTimeout> | undefined;
function show(msg: string, bad: boolean, undo: boolean, ms: number) {
  clearTimeout(timer);
  useToastStore.setState((s) => ({ id: s.id + 1, msg, bad, undo, visible: true }));
  timer = setTimeout(hideToast, ms);
}
export const toast = (msg: string, opts: { bad?: boolean } = {}): void =>
  show(msg, !!opts.bad, false, opts.bad ? 4000 : 2400);
export const toastUndo = (msg: string): void => show(msg, false, true, 5500);
export function hideToast(): void {
  clearTimeout(timer);
  useToastStore.setState({ visible: false });
}
/** Keep the toast up while it is being touched; let it go after a short while. */
export function holdToast(hold: boolean): void {
  clearTimeout(timer);
  if (!hold) timer = setTimeout(hideToast, 2400);
}
