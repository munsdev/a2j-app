import type { ReactNode } from "react";
import { Eyebrow } from "./Layout";
import { Icon, type IconName } from "./Icon";
import { useSheetFocus } from "./useSheetFocus";

/** The top of a sheet: an eyebrow with an icon, the heading (focused when the sheet opens, so screen readers
 *  announce where they are; pass focusHeading=false when a field should get focus instead), a line under it. */
export function SheetHead({
  icon,
  eyebrow,
  title,
  sub,
  focusHeading = true,
  children,
}: {
  icon?: IconName;
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  focusHeading?: boolean;
  children?: ReactNode;
}) {
  const ref = useSheetFocus<HTMLHeadingElement>();
  return (
    <header className="flex flex-col gap-1.5 pr-11">
      {eyebrow && (
        <Eyebrow>
          {icon && <Icon name={icon} />}
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        ref={focusHeading ? ref : undefined}
        tabIndex={-1}
        className="text-heading break-words hyphens-auto outline-none"
      >
        {title}
      </h2>
      {sub && <p className="text-small text-ink-3">{sub}</p>}
      {children}
    </header>
  );
}
