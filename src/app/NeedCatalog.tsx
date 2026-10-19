import { useEffect, type ReactNode } from "react";
import { loadCatalog, useCatalog } from "@/domain/catalog";
import { useLang, useT } from "@/i18n";
import { LineMark } from "@/ui/LineMark";
import { Button } from "@/ui/Button";

/* Screens that need the catalogue wrap their content in <NeedCatalog>: it loads the files (about 3 MB, cached
   for offline use after the first time) and shows a friendly loading state meanwhile. Inside, useEscoReady()
   always returns the catalogue. */
export function NeedCatalog({ children }: { children: ReactNode }) {
  const lang = useLang();
  const t = useT();
  const { esco, status } = useCatalog();
  useEffect(() => {
    void loadCatalog(lang);
  }, [lang]);
  if (esco) return <>{children}</>;
  return (
    <div className="flex flex-col items-center gap-3 px-2.5 py-16 text-center text-ink-2" role="status">
      <LineMark height={32} state={status === "error" ? "way" : "waiting"} />
      {status === "error" ? (
        <>
          <p className="font-bold text-no">{t("loadfail")}</p>
          <Button size="sm" onClick={() => void loadCatalog(lang)}>
            {t("retry")}
          </Button>
        </>
      ) : (
        <p>{t("loading")}</p>
      )}
    </div>
  );
}
