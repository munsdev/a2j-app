import { useMemo } from "react";
import { useEsco } from "@/app/catalog";
import { update, useDoc } from "@/data/store";
import { skLabel } from "@/domain/catalog";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Icon, SheetHead } from "@/ui";
import { wantRows } from "./logic";
import { strings } from "./strings";

/* More or less of what: thumbs up or down on each rated skill. Steers the job ideas. Tap again to clear. */
export function WantSheet() {
  const t = useT(strings);
  const E = useEsco();
  const rated = useDoc((d) => d.esco.rated);
  const want = useDoc((d) => d.esco.want);
  const rows = useMemo(() => (E ? wantRows(rated, (i) => skLabel(E, i)) : []), [E, rated]);
  const set = (x: number, dir: 1 | -1) =>
    update((d) => {
      if (d.esco.want[x] === dir) delete d.esco.want[x];
      else d.esco.want[x] = dir;
    });
  return (
    <>
      <SheetHead title={t("res_want")} sub={t("res_want_p")} />
      <ul className="flex flex-col">
        {rows.map(([x, l]) => {
          const name = skLabel(E, x);
          const d = want[x] ?? 0;
          return (
            <li key={x} className="flex items-center gap-2 border-t border-line py-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="font-bold">{name}</b>
                <span className="text-caption text-ink-3">{t(`lv${l}` as "lv1")}</span>
              </span>
              <Thumb on={d > 0} up label={`${t("more")}: ${name}`} onClick={() => set(x, 1)} />
              <Thumb on={d < 0} label={`${t("less")}: ${name}`} onClick={() => set(x, -1)} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Thumb({
  on,
  up,
  label,
  onClick,
}: {
  on: boolean;
  up?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-11 flex-none items-center justify-center rounded-control transition-colors",
        on ? (up ? "bg-yes-bg text-yes" : "bg-no-bg text-no") : "bg-surface-2 text-ink-3 hover:text-ink",
      )}
    >
      <Icon name="up" flip={!up} />
    </button>
  );
}
