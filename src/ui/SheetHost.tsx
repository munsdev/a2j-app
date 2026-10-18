import { Dialog, VisuallyHidden } from "radix-ui";
import { closeSheet, useSheetStore } from "@/app/sheet";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/* Renders the one sheet. Radix handles focus trapping, Escape, and returning focus to the trigger. */
export function SheetHost() {
  const { open, node, opts, key } = useSheetStore();
  const t = useT();
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && closeSheet()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            /* Escape in a field with its suggestion list open closes the list, not the sheet */
            if ((e.target as HTMLElement | null)?.closest?.('[role="combobox"][aria-expanded="true"]'))
              e.preventDefault();
          }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-surface text-ink shadow-lift outline-none",
            /* phones: a bottom sheet */
            "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-panel pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-sheet-up",
            /* computers: a centred card */
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(88dvh,900px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel sm:pb-0 sm:data-[state=open]:animate-sheet-in",
            opts.wide ? "sm:w-[min(820px,calc(100vw-32px))]" : "sm:w-[min(640px,calc(100vw-32px))]",
          )}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>{opts.label}</Dialog.Title>
          </VisuallyHidden.Root>
          <div
            className="pointer-events-none absolute top-[7px] left-1/2 h-[5px] w-10 -translate-x-1/2 rounded-[3px] bg-line-2 sm:hidden"
            aria-hidden="true"
          />
          <Dialog.Close
            className="absolute top-2 right-2 z-[2] inline-flex size-11 items-center justify-center rounded-control hover:bg-surface-2"
            aria-label={t("close")}
          >
            <Icon name="close" />
          </Dialog.Close>
          <div
            key={key}
            className="flex flex-col gap-3.5 overflow-y-auto overscroll-contain px-4 pt-5 pb-6 sm:px-5 sm:pt-[22px] sm:pb-[26px] [&>h2:first-of-type]:pr-11 [&>h2:first-of-type]:text-heading"
          >
            {node}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
