import { makeT } from "@/i18n";
import { useSettings } from "@/app/settings";
import { toast } from "@/app/toast";

/** Copy text. When the browser refuses, select the fallback field so the person can copy by hand. */
export async function copyText(text: string, fallback?: HTMLTextAreaElement | null): Promise<boolean> {
  const t = makeT(useSettings.getState().lang);
  try {
    await navigator.clipboard.writeText(text);
    toast(t("t_copied"));
    return true;
  } catch {
    if (fallback) {
      fallback.hidden = false;
      fallback.value = text;
      fallback.focus();
      fallback.select();
    }
    toast(t("t_copy_fail"), { bad: true });
    return false;
  }
}
