import { createElement } from "react";
import { openSheet } from "@/app/sheet";
import { useSettings } from "@/app/settings";
import { makeT } from "@/i18n";
import type { PromptKey } from "./library";
import { PromptItem, PromptsList } from "./sheets";
import { strings } from "./strings";

/* CONTRACT (owned by the Courses/Prompts/Plan build):
   openPrompts(): the AI prompts library sheet (menu item "AI prompts"). */
const t = () => makeT(useSettings.getState().lang, strings);

export function openPrompts(): void {
  openSheet(createElement(PromptsList), { label: t()("ai_h") });
}

/** One prompt of the library, in its own sheet (Back returns to the list). */
export function openPromptItem(k: PromptKey): void {
  openSheet(createElement(PromptItem, { k }), { wide: true, label: t()(`plt_${k}`) });
}
