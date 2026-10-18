/** Move focus to an element for a screen change (a new question, a new card), unless the person has put focus
 *  somewhere on purpose meanwhile: an open menu or dialog, or the top bar. A screen that renders late (slow
 *  phone, code still loading) must not close the menu someone just opened. */
export function focusForStep(el: HTMLElement | null | undefined): void {
  if (!el) return;
  const active = document.activeElement as HTMLElement | null;
  if (document.querySelector('[role="dialog"][data-state="open"], [role="menu"][data-state="open"]')) return;
  if (active?.closest('header, [role="menu"], [role="dialog"], [role="listbox"]')) return;
  el.focus({ preventScroll: true });
}
