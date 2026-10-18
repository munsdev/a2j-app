import type { AnchorHTMLAttributes } from "react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** A link to another site: opens in a new tab, never passes the referrer, says so to screen readers.
 *  Only pass URLs that went through safeUrl() when they come from a person or an AI answer. */
export function ExternalLink({
  className,
  children,
  icon = true,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; icon?: boolean }) {
  const t = useT();
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...rest}
    >
      {children}
      {icon && <Icon name="ext" className="size-4" />}
      <span className="sr-only"> {t("opens_new_tab")}</span>
    </a>
  );
}
