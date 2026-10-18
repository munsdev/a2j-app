import type { ReactNode } from "react";
import { create } from "zustand";

/* =================== THE SHEET ===================
   One dialog for everything that opens on top: a centred card on computers, a bottom sheet on phones.
   openSheet(<MyContent />) shows it. The content is a component, so it stays live with the stores.
   Opening adds a history entry, so phone Back closes the sheet instead of leaving the screen. */

export interface SheetOptions {
  /** accessible name of the dialog */
  label: string;
  /** 820px instead of 640px, for long forms and prompts */
  wide?: boolean;
  /** called after the sheet closed, however it closed */
  onClose?: () => void;
}
interface SheetState {
  open: boolean;
  node: ReactNode;
  opts: SheetOptions;
  /** bumps on every openSheet, so the content scrolls to the top when it is replaced */
  key: number;
}
export const useSheetStore = create<SheetState>(() => ({
  open: false,
  node: null,
  opts: { label: "" },
  key: 0,
}));

export function openSheet(node: ReactNode, opts: SheetOptions): void {
  const s = useSheetStore.getState();
  if (!s.open) {
    try {
      history.pushState({ sheet: true }, "", location.href);
    } catch {
      /* no history: Back simply leaves */
    }
  }
  useSheetStore.setState({ open: true, node, opts, key: s.key + 1 });
}

/** Close without touching history (used by the router and by Back). */
export function closeSheetSilently(): void {
  const { open, opts } = useSheetStore.getState();
  if (!open) return;
  useSheetStore.setState({ open: false });
  opts.onClose?.();
}

/** Close the sheet and drop its history entry. */
export function closeSheet(): void {
  if (!useSheetStore.getState().open) return;
  if ((history.state as { sheet?: boolean } | null)?.sheet) history.back();
  else closeSheetSilently();
}
