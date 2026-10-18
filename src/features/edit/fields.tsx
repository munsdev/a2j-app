import { useEffect, useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { DeleteButton, Input, Textarea } from "@/ui";

/* Small controls for Edit my data. */

type Commit = { value: string; onCommit: (v: string) => void };
type InputProps = Commit & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onBlur">;
type AreaProps = Commit &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onBlur"> & {
    multiline: true;
  };

/** A text field that saves when the person leaves it (one undo step per field, not per key), trimmed.
 *  It follows outside changes (undo, another profile) and saves what was typed if it disappears while
 *  focused. */
export function CommitText(props: InputProps | AreaProps) {
  // a new stored value (after saving, undo or a restore) starts the field over with that value
  return <CommitTextInner key={props.value} {...props} />;
}

function CommitTextInner(props: InputProps | AreaProps) {
  const el = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const saved = useRef(props.value);
  const onCommit = useRef(props.onCommit);
  useEffect(() => {
    onCommit.current = props.onCommit;
  });
  const save = (raw: string) => {
    const v = raw.trim();
    if (v === saved.current) return;
    saved.current = v;
    onCommit.current(v);
  };
  useEffect(() => {
    const node = el.current;
    return () => {
      if (node) save(node.value);
    };
  }, []);
  if ("multiline" in props) {
    const { value, onCommit: _c, multiline: _m, ...rest } = props;
    return <Textarea ref={el} defaultValue={value} onBlur={(e) => save(e.target.value)} {...rest} />;
  }
  const { value, onCommit: _c, ...rest } = props;
  return <Input ref={el} defaultValue={value} onBlur={(e) => save(e.target.value)} {...rest} />;
}

/** The kit's DeleteButton for a row (icon only, "Tap again to delete" when armed), keeping keyboard focus on
 *  it. The kit button renders a different element when it arms and disarms, which drops the focus to the
 *  page; when the focused button is swapped out, the focus moves to its replacement. */
export function RowDelete({
  label,
  onDelete,
  className,
}: {
  label: string;
  onDelete: () => void;
  className?: string;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(() => {
      const a = document.activeElement;
      if (focused.current && (!a || a === document.body)) el.querySelector("button")?.focus();
    });
    mo.observe(el, { childList: true });
    return () => mo.disconnect();
  }, []);
  return (
    <span
      ref={box}
      className={cn("flex flex-none justify-end", className)}
      onFocus={() => (focused.current = true)}
      onBlur={(e) => {
        const btn = e.target;
        /* a button that was swapped out did not hand the focus to something else: keep it for the new one */
        queueMicrotask(() => {
          if (btn.isConnected) focused.current = false;
        });
      }}
    >
      <DeleteButton iconOnly label={label} onDelete={onDelete} />
    </span>
  );
}
