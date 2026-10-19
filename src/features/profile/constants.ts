import type { Lang, PartKey } from "@/data/types";

/* Fixed lists of the profile screen. Content (statements, scales, groups) lives in domain/items.ts. */

/** How often an aptitude shows up, for a 1..5 score in five bands (see band() in domain/assess). */
export const BANDS: Record<Lang, readonly string[]> = {
  en: ["rarely", "now and then", "sometimes", "often", "very often"],
  de: ["selten", "ab und zu", "manchmal", "oft", "sehr oft"],
};
/** How much someone likes an interest type, in five bands. */
export const IBANDS: Record<Lang, readonly string[]> = {
  en: ["not my thing", "not really", "so-so", "quite like", "really like"],
  de: ["gar nicht", "eher nicht", "teils, teils", "eher gern", "sehr gern"],
};

/** The five steps of part 5, Your story. */
export const STORY = ["you", "now", "jobs", "want", "more"] as const;
export type StoryStep = (typeof STORY)[number];

/** Parts given as #profile/<part>. */
export const isPart = (s: string | undefined): s is PartKey =>
  s === "apt" || s === "int" || s === "set" || s === "val" || s === "story" || s === "skills";

/** The resting, hover and chosen look of an answer card (questions, values). Chosen = the shared selected
 *  ring; hover only strengthens the outline and keeps the card's shadow. The hover shadow is two tokens
 *  composed (there is no single utility for a ring on top of a card shadow), as in the kit's LevelPicker. */
export const optionLook = (on: boolean) =>
  on ? "shadow-selected" : "shadow-card hover:shadow-[var(--shadow-ring-strong),var(--shadow-card)]";
