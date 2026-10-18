import { useId, useRef } from "react";
import { resetPrompt, setPromptText, usePromptStore } from "@/app/prompts";
import { toast } from "@/app/toast";
import { copyText } from "@/lib/clipboard";
import { useT } from "@/i18n";
import { Button, LinkButton } from "./Button";
import { ButtonRow } from "./Layout";
import { Textarea } from "./Form";
import { Icon } from "./Icon";

/* A generated text in an editable field, with Copy and Reset. `text` is regenerated on every render from the
   person's latest choices; once they edit the field, their words are kept until Reset. */
export function PromptBox({
  id,
  text,
  label,
  rows = 8,
  small,
  resetLabel,
  labelledBy,
}: {
  /** stable id: edits are remembered per id */
  id: string;
  text: string;
  label?: string;
  rows?: number;
  small?: boolean;
  resetLabel?: string;
  /** id of a heading that names the field, when there is no label */
  labelledBy?: string;
}) {
  const t = useT();
  const fid = useId();
  const edited = usePromptStore((s) => s.edited[id]);
  const value = edited ?? text;
  const dirty = edited != null && edited !== text;
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={fid} className="text-small font-extrabold">
          {label}
        </label>
      )}
      <Textarea
        id={fid}
        aria-labelledby={labelledBy}
        ref={ref}
        mono
        spellCheck={false}
        rows={rows}
        value={value}
        onChange={(e) => (e.target.value === text ? resetPrompt(id) : setPromptText(id, e.target.value))}
        className={small ? "min-h-[60px]" : "min-h-[110px]"}
      />
      {dirty && <p className="text-small text-have-ink">{t("pb_dirty")}</p>}
      <ButtonRow>
        <Button variant="primary" onClick={() => void copyText(value, ref.current)}>
          <Icon name="copy" />
          {t("copy_prompt")}
        </Button>
        <LinkButton
          className="gap-1.5 self-center px-1 [&_svg]:size-4"
          onClick={() => {
            resetPrompt(id);
            toast(t("t_reset"));
          }}
        >
          <Icon name="reset" />
          {resetLabel ?? t("reset_prompt")}
        </LinkButton>
      </ButtonRow>
    </div>
  );
}
