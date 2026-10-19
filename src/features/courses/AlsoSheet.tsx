import { useState } from "react";
import { update, useDoc } from "@/data/store";
import { closeSheet } from "@/app/sheet";
import { useT } from "@/i18n";
import { ActionBar, Button, Chips, Icon, SheetHead, ToggleChip } from "@/ui";
import { strings } from "./strings";

/** After keeping courses: does a course also count for other jobs that need the skills it covers? */
export function AlsoSheet({
  courseIds,
  jobIds,
}: {
  courseIds: readonly string[];
  jobIds: readonly string[];
}) {
  const t = useT(strings);
  const jobs = useDoc((d) => d.jobs).filter((j) => jobIds.includes(j.id));
  const [on, setOn] = useState<string[]>([]);
  const save = () => {
    if (on.length)
      update((d) =>
        d.courses
          .filter((c) => courseIds.includes(c.id))
          .forEach((c) => on.forEach((id) => !c.goals.includes(id) && c.goals.push(id))),
      );
    closeSheet();
  };
  return (
    <>
      <SheetHead title={t("f_also")} sub={t("f_also_p")} />
      <Chips>
        {jobs.map((j) => {
          const pressed = on.includes(j.id);
          return (
            <ToggleChip
              key={j.id}
              pressed={pressed}
              onClick={() => setOn((l) => (pressed ? l.filter((x) => x !== j.id) : [...l, j.id]))}
            >
              {j.role === "goal" && <Icon name="flag" />}
              {j.title}
            </ToggleChip>
          );
        })}
      </Chips>
      <ActionBar static>
        <Button variant="ghost" onClick={closeSheet}>
          {t("f_also_none")}
        </Button>
        <Button variant="primary" onClick={save}>
          <Icon name="check" />
          {t("save")}
        </Button>
      </ActionBar>
    </>
  );
}
