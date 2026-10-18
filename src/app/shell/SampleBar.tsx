import { useEffect, useState } from "react";
import { useDoc } from "@/data/store";
import { loadExamples, exampleName, type ExampleId } from "@/data/examples";
import { backToOwn, ownKept, sampleStrings, startOwn } from "@/app/samples";
import { useT, useLang } from "@/i18n";
import { Mascot } from "@/ui/Mascot";
import { LinkButton } from "@/ui/Button";
import { openSamplePicker } from "@/features/backup/sheets";

/** The bar under the top bar while a sample is open. */
export function SampleBar() {
  const example = useDoc((d) => d.example) as ExampleId | undefined;
  const name = useDoc((d) => d.profile.name);
  const lang = useLang();
  const t = useT(sampleStrings);
  const [, setReady] = useState(false);
  useEffect(() => {
    if (example) void loadExamples().then(() => setReady(true));
  }, [example]);
  if (!example) return null;
  const kept = ownKept();
  return (
    <div className="flex items-center justify-center gap-x-3 bg-accent-soft px-4 text-small font-bold text-accent-ink print:hidden">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Mascot size={22} mood="wink" />
        <span className="truncate">{t("sb_text", { x: name || exampleName(example, lang) })}</span>
      </span>
      {/* also in the menu ("Try a sample profile"): on small phones the bar keeps to one line */}
      <LinkButton className="text-inherit max-sm:hidden" onClick={() => openSamplePicker()}>
        {t("sb_switch")}
      </LinkButton>
      {kept ? (
        <LinkButton className="flex-none text-inherit" onClick={() => backToOwn()}>
          {t("sb_back")}
        </LinkButton>
      ) : (
        <LinkButton className="flex-none text-inherit" onClick={() => startOwn()}>
          {t("sb_own")}
        </LinkButton>
      )}
    </div>
  );
}
