import { useArmed } from "@/lib/useArmed";
import { useT } from "@/i18n";
import { Button, IconButton } from "./Button";
import { Icon } from "./Icon";

/* Delete with a two-step confirm: the first press arms it ("Tap again to delete"), a second press within four
   seconds deletes. icon-only for rows (the label still says what is deleted). */
export function DeleteButton({
  onDelete,
  label,
  iconOnly,
  className,
}: {
  onDelete: () => void;
  /** "Delete", or "Delete: Baker" for an icon-only row button */
  label: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useT();
  const [armed, press] = useArmed();
  const go = () => {
    if (press()) onDelete();
  };
  if (iconOnly)
    return armed ? (
      <Button variant="danger" size="sm" onClick={go} className={className}>
        {t("again_delete")}
      </Button>
    ) : (
      <IconButton onClick={go} aria-label={label} className={className ?? "text-ink-3 hover:text-no"}>
        <Icon name="trash" />
      </IconButton>
    );
  return (
    <Button variant={armed ? "danger" : "danger-ghost"} onClick={go} className={className}>
      <Icon name="trash" />
      {armed ? t("again_delete") : label}
    </Button>
  );
}
