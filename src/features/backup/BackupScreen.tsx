import { useEffect, useId, useRef, useState } from "react";
import { go, useRoute } from "@/app/router";
import { profileReplaced } from "@/app/samples";
import { toastUndo } from "@/app/toast";
import { markExported, replaceDoc, resetChanges, useDoc, useDocStore } from "@/data/store";
import { hasOwnData, shape } from "@/data/doc";
import { useLang, useT } from "@/i18n";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { Button, ButtonRow, Field, Icon, Page, PageHeader, Panel, PanelTitle, Textarea } from "@/ui";
import { downloadBackup } from "./io";
import { checkBackup, docCounts, exportDoc, type BackupCheck } from "./model";
import { backupStrings } from "./strings";

/* =================== BACKUP ===================
   Save the document as a file (or as text), and restore one: check it first, see what is in it, then replace. */

export default function BackupScreen() {
  const t = useT(backupStrings);
  return (
    <Page>
      <PageHeader title={t("bk_title")} lede={t("bk_lede")} />
      <Status />
      <SavePanel />
      <RestorePanel />
    </Page>
  );
}

function Status() {
  const t = useT(backupStrings);
  const lang = useLang();
  const d = useDoc();
  const meta = useDocStore((s) => s.meta);
  let text: string;
  let tone: "plain" | "due" | "ok" = "plain";
  if (d.example) text = t("bk_sample");
  else if (!hasOwnData(d)) text = t("bk_empty");
  else {
    const counts = docCounts(d).map((c) => t(c.key, { n: c.n }));
    const when = meta.exported ? new Date(meta.exported).toLocaleDateString(lang) : null;
    const state = !when
      ? t("bk_none")
      : meta.changes
        ? t("bk_when", { d: when, n: meta.changes })
        : t("bk_uptodate", { d: when });
    text = (counts.length ? counts.join(", ") + ". " : "") + state;
    tone = !when || meta.changes ? "due" : "ok";
  }
  return (
    <p
      className="flex items-start gap-3 rounded-card bg-surface px-4 py-3.5 font-semibold shadow-card"
      aria-live="polite"
    >
      {/* 7px: centres the 10px dot on the first 24px line */}
      <span
        aria-hidden="true"
        className={cn(
          "mt-[7px] size-2.5 flex-none rounded-full",
          tone === "due" ? "bg-have" : tone === "ok" ? "bg-yes" : "bg-line-2",
        )}
      />
      <span>{text}</span>
    </p>
  );
}

function SavePanel() {
  const t = useT(backupStrings);
  const fallback = useRef<HTMLTextAreaElement>(null);
  return (
    <Panel aria-labelledby="bk-save-h">
      <PanelTitle id="bk-save-h">
        <Icon name="download" />
        {t("bk_save_h")}
      </PanelTitle>
      <ButtonRow>
        <Button variant="primary" onClick={downloadBackup}>
          <Icon name="doc" />
          {t("bk_dl")}
        </Button>
        <Button
          onClick={async () => {
            if (await copyText(exportDoc(useDocStore.getState().doc), fallback.current)) markExported();
          }}
        >
          <Icon name="copy" />
          {t("bk_copy")}
        </Button>
      </ButtonRow>
      {/* shown and selected by copyText when the browser does not allow copying */}
      <Textarea ref={fallback} hidden readOnly mono rows={6} aria-label={t("bk_copy")} />
    </Panel>
  );
}

function RestorePanel() {
  const t = useT(backupStrings);
  const route = useRoute();
  const [text, setText] = useState("");
  const [result, setResult] = useState<BackupCheck | null>(null);
  const reportId = useId();
  const fileLabelId = useId();
  const fileNameId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  /* #backup/restore: bring the panel into view and put the focus on its heading */
  const wantRestore = route.params[0] === "restore";
  useEffect(() => {
    if (!wantRestore) return;
    const id = requestAnimationFrame(() => {
      document.getElementById("bk-restore")?.scrollIntoView({ block: "start" });
      document.getElementById("bk-restore-h")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [wantRestore, route.path]);

  const check = (s: string) => setResult(checkBackup(s));

  const apply = () => {
    if (!result?.ok) return;
    const doc = shape(result.doc);
    delete doc.example;
    replaceDoc(doc);
    resetChanges();
    profileReplaced();
    setResult(null);
    toastUndo(t("bk_restored"));
    go("home");
  };

  return (
    <Panel id="bk-restore" aria-labelledby="bk-restore-h" className="scroll-mt-28">
      <PanelTitle id="bk-restore-h" tabIndex={-1} className="outline-none">
        <Icon name="upload" />
        {t("bk_restore_h")}
      </PanelTitle>
      <p className="-mt-1 max-w-[62ch] text-ink-2">{t("bk_restore_p")}</p>
      {/* the browser's own file field speaks the browser's language: a hidden input behind a kit button */}
      <div className="flex flex-col gap-1.5">
        <span id={fileLabelId} className="text-small font-extrabold">
          {t("bk_file")}
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json,text/plain"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = ""; // choosing the same file again still counts
              if (!f) return;
              setFileName(f.name);
              const rd = new FileReader();
              rd.onload = () => check(String(rd.result ?? ""));
              rd.readAsText(f);
            }}
          />
          <Button
            aria-describedby={`${fileLabelId} ${fileNameId} ${reportId}`}
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="doc" />
            {t("bk_choose")}
          </Button>
          <span
            id={fileNameId}
            className={cn("min-w-0 text-small break-all", fileName ? "font-bold text-ink" : "text-ink-3")}
          >
            {fileName ?? t("bk_nofile")}
          </span>
        </div>
      </div>
      <Field label={t("bk_paste")}>
        {(p) => (
          <Textarea
            id={p.id}
            rows={3}
            spellCheck={false}
            mono
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </Field>
      <ButtonRow>
        <Button onClick={() => check(text)}>
          <Icon name="search" />
          {t("bk_check")}
        </Button>
      </ButtonRow>
      <div id={reportId} aria-live="polite" className="empty:hidden">
        {result &&
          (result.ok ? (
            <div className="flex flex-col items-start gap-3 rounded-card bg-yes-bg p-4">
              <p className="flex items-start gap-2.5 font-bold text-yes">
                <Icon name="check" className="mt-0.5" />
                <span>
                  {t("bk_has", {
                    x:
                      docCounts(result.doc)
                        .map((c) => t(c.key, { n: c.n }))
                        .join(", ") || "–",
                  })}
                </span>
              </p>
              <Button variant="primary" onClick={apply}>
                {t("bk_replace")}
              </Button>
            </div>
          ) : (
            <p className="flex items-start gap-2.5 rounded-card bg-no-bg p-4 font-bold text-no">
              <Icon name="warn" className="mt-0.5" />
              <span>{t(result.error)}</span>
            </p>
          ))}
      </div>
    </Panel>
  );
}
