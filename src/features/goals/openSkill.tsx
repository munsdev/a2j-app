import type { SkillRef } from "@/data/types";
import { openSheet } from "@/app/sheet";
import { useCatalog } from "@/domain/catalog";
import { skName } from "@/domain/skills";
import { SkillSheet } from "./SkillSheet";

/** Open the skill sheet: from a tile on a card's back or a square on the board. onClose: what to do once it is
 *  closed (bring back the sheet it was opened from). */
export function openSkill(
  x: SkillRef,
  occ: number | null,
  jobId?: string | null,
  onClose?: () => void,
): void {
  openSheet(<SkillSheet x={x} occ={occ} jobId={jobId ?? null} />, {
    label: skName(useCatalog.getState().esco, x),
    onClose,
  });
}
