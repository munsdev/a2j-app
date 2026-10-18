import { useDoc } from "@/data/store";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Hint, Icon, Panel, RowButton } from "@/ui";
import { openItem, type ItemKind } from "@/features/courses/api";
import { editStrings } from "./strings";

/** Saved courses or job ads, each opening its form; and a button to add one by hand. */
export function ItemsTab({ kind }: { kind: ItemKind }) {
  const t = useT(editStrings);
  const courses = useDoc((d) => d.courses);
  const jobads = useDoc((d) => d.jobads);
  const rows =
    kind === "course"
      ? courses.map((c) => ({ id: c.id, name: c.name, meta: [c.provider, c.start] }))
      : jobads.map((a) => ({ id: a.id, name: a.name, meta: [a.org, a.place] }));
  /* courses wear the course colour (a course covers skills); job ads are not a skill state: the accent */
  const lead = (
    <span
      className={cn(
        "flex size-10 items-center justify-center rounded-tile",
        kind === "course"
          ? "bg-course-bg [&_svg]:text-course-ink!"
          : "bg-accent-soft [&_svg]:text-accent-ink!",
      )}
    >
      <Icon name={kind === "course" ? "book" : "bag"} />
    </span>
  );
  return (
    <Panel className="gap-4 p-3 sm:p-5">
      {rows.length ? (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <RowButton
                lead={lead}
                title={r.name}
                detail={r.meta.filter(Boolean).join(" · ") || undefined}
                onClick={() => openItem(kind, r.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Hint className="px-1">{t("e_none")}</Hint>
      )}
      <Button className="self-start" onClick={() => openItem(kind, null)}>
        <Icon name="plus" />
        {t(kind === "course" ? "e_add_course" : "e_add_ad")}
      </Button>
    </Panel>
  );
}
