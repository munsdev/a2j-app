import { useState } from "react";
import type { Doc, PartKey } from "@/data/types";
import { NeedCatalog } from "@/app/NeedCatalog";
import { update } from "@/data/store";
import { ensureAssess } from "@/domain/assess";
import { todayIso } from "../logic";
import { DoneScreen } from "./DoneScreen";
import { useCommitOnLeave } from "./hooks";
import { QuestionRun } from "./QuestionRun";
import { SettingRun } from "./SettingRun";
import { SkillsRun } from "./SkillsRun";
import { StoryRun } from "./StoryRun";
import { ValuesRun } from "./ValuesRun";

/* One visit to a part. Mounted with a key per part and profile, so its state (position, picks, the deck)
   starts fresh on every visit and when a sample or backup replaces the data. Finishing marks the part done
   with today's date and closes the visit's quiet answers into one undo step. */
export function PartRun({ part }: { part: PartKey }) {
  const [done, setDone] = useState(false);
  useCommitOnLeave();

  const finish = (recipe?: (d: Doc) => void) => {
    update((d) => {
      recipe?.(d);
      ensureAssess(d).done[part] = todayIso();
    });
    setDone(true);
    window.scrollTo(0, 0);
  };

  /* parts without their own recipe get a plain callback, so a click event is never taken for a recipe */
  const finishPlain = () => finish();

  if (done) return <DoneScreen part={part} />;
  switch (part) {
    case "apt":
    case "int":
      return <QuestionRun key={part} part={part} onFinish={finishPlain} />;
    case "set":
      return <SettingRun onFinish={finishPlain} />;
    case "val":
      return <ValuesRun onFinish={finish} />;
    case "story":
      return <StoryRun onFinish={finish} />;
    case "skills":
      return (
        <NeedCatalog>
          <SkillsRun onFinish={finishPlain} />
        </NeedCatalog>
      );
  }
}
