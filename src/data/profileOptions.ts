import type { ComputerLevel, GermanLevel, Hours, Place, Situation } from "./types";

/* The choices of the profile's select fields, in the order they are offered. Used by Your story, Edit my data
   and the AI prompts; their labels are in i18n/profileFields (w_sit_*, w_hours_*, w_place_*) and i18n/common
   (g_*, pc_*). */
export const GERMAN_LEVELS: readonly GermanLevel[] = ["native", "c", "b2", "b1", "a2", "a1", "unknown"];
export const PC_LEVELS: readonly ComputerLevel[] = ["low", "basic", "daily", "work"];
export const SITUATIONS: readonly Situation[] = ["employed", "seeking", "training", "returning", "other"];
export const HOURS: readonly Hours[] = ["full", "part", "flex"];
export const PLACES: readonly Place[] = ["onsite", "hybrid", "remote", "any"];
