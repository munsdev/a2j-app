import { update } from "@/data/store";
import { mergeItem, type ItemKind } from "@/data/dupes";
import { fillRouteCourse } from "@/data/routes";
import type { MergeChoice } from "./MergeView";

/** Merge a new course or job ad into a saved one. Mutates via update; one undo step. */
export function mergeInto(
  kind: ItemKind,
  savedId: string,
  c: MergeChoice,
  goals: readonly string[],
  dropId?: string | null,
): void {
  update((d) => {
    mergeItem(d, kind, savedId, c.values, { goals }, dropId);
    if (kind === "course" && c.covers) {
      const x = d.courses.find((y) => y.id === savedId);
      if (x) x.covers = c.covers;
      goals.forEach((g) => fillRouteCourse(d, savedId, g));
    }
  });
}
