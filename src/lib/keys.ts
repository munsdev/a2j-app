/** True when a global keyboard shortcut must not act: the person is typing in a field, or a dialog or menu is
 *  open on top of the screen. Use it for every document-level shortcut (undo, answer keys, the idea deck). */
export function isShortcutBlocked(e: KeyboardEvent, opts: { allowModifiers?: boolean } = {}): boolean {
  if (!opts.allowModifiers && (e.ctrlKey || e.metaKey || e.altKey)) return true;
  const el = e.target as HTMLElement | null;
  if (
    el &&
    (el.isContentEditable || ["input", "textarea", "select"].includes((el.tagName || "").toLowerCase()))
  )
    return true;
  return !!document.querySelector('[role="dialog"][data-state="open"], [role="menu"][data-state="open"]');
}
