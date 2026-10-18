import { create } from "zustand";

/* Generated texts (AI prompts, search words) shown in an editable field. Until the person edits one it keeps
   following their latest choices; once edited it keeps their words until they press Reset. */
interface PromptState {
  edited: Record<string, string>;
}
export const usePromptStore = create<PromptState>(() => ({ edited: {} }));
export const setPromptText = (id: string, text: string) =>
  usePromptStore.setState((s) => ({ edited: { ...s.edited, [id]: text } }));
export const resetPrompt = (id: string) =>
  usePromptStore.setState((s) => {
    const edited = { ...s.edited };
    delete edited[id];
    return { edited };
  });
/** Forget every edit (after a language switch or when another profile opens). */
export const resetAllPrompts = () => usePromptStore.setState({ edited: {} });
