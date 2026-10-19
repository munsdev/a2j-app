import { useRef, useState, type ReactNode } from "react";
import type { Doc, PartKey } from "@/data/types";
import { NeedCatalog } from "@/app/NeedCatalog";
import { go, useStepBack } from "@/app/router";
import { update } from "@/data/store";
import { ensureAssess } from "@/domain/assess";
import { todayIso } from "../logic";
import { DoneScreen } from "./DoneScreen";
import { RunBack, useCommitOnLeave } from "./hooks";
import { QuestionRun } from "./QuestionRun";
import { SettingRun } from "./SettingRun";
import { SkillsRun } from "./SkillsRun";
import { StoryRun } from "./StoryRun";
import { ValuesRun } from "./ValuesRun";

/* One visit to a part. Mounted with a key per part and profile, so its state (position, picks, the deck)
   starts fresh on every visit and when a sample or backup replaces the data. Finishing marks the part done
   with today's date and closes the visit's quiet answers into one undo step. Phone Back goes one step back in
   the run, and leaves for the overview from the first step and the done screen. */
export function PartRun({ part }: { part: PartKey }) {
  const [done, setDone] = useState(false);
  const back = useRef<(() => void) | null>(null);
  useCommitOnLeave();
  useStepBack(() => (back.current ? back.current() : go("profile")));

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

  return <RunBack.Provider value={back}>{done ? <DoneScreen part={part} /> : run()}</RunBack.Provider>;

  function run(): ReactNode {
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
}
