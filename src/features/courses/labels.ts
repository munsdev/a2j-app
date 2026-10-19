import type { TextField } from "./found";
import type { ItemKind } from "./types";
import type { strings } from "./strings";

/** The label key of a course or job ad field (the form and the duplicate check share them). */
export function labelKey(kind: ItemKind, k: TextField): keyof typeof strings.en {
  if (k === "name") return kind === "course" ? "ce_name" : "ae_name";
  if (k === "url" || k === "notes") return `ce_${k}`;
  return (kind === "course" ? `ce_${k}` : `ae_${k}`) as keyof typeof strings.en;
}
