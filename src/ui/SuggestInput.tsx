import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Input } from "./Form";

/* A text field with its own suggestion list under it (phones barely show a <datalist>).
   The caller works out the suggestions from the value; picking one fills the field and calls onPick.
   Keyboard: arrows move, Enter picks, Escape closes. */
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onValueChange: (v: string) => void;
  suggestions: readonly string[];
  /** a suggestion was chosen (after onValueChange) */
  onPick?: (v: string) => void;
};

export const SuggestInput = forwardRef<HTMLInputElement, Props>(function SuggestInput(
  { value, onValueChange, suggestions, onPick, className, onKeyDown, onFocus, onBlur, ...rest },
  ref,
) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = suggestions.slice(0, 8);
  const shown = open && items.length > 0 && value.trim().length > 0;
  const pick = (v: string) => {
    onValueChange(v);
    setOpen(false);
    setActive(-1);
    onPick?.(v);
  };
  return (
    <div className="relative min-w-0 flex-1">
      <Input
        ref={ref}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={shown ? listId : undefined}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        className={className}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (shown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            const n = items.length;
            setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
          } else if (shown && e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]);
          } else if (shown && e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
          }
          onKeyDown?.(e);
        }}
        {...rest}
      />
      {shown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain rounded-[13px] border-[1.5px] border-line-2 bg-surface p-1.5 shadow-lift"
        >
          {items.map((s, k) => (
            <li
              key={s + k}
              id={`${listId}-${k}`}
              role="option"
              aria-selected={k === active}
              /* keep the field focused while a suggestion is tapped */
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center rounded-[9px] px-3 py-2.5 font-semibold hover:bg-sunk",
                k === active && "bg-sunk",
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
