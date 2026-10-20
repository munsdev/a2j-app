import { Component, type ErrorInfo, type ReactNode } from "react";
import { crashReport, crumb } from "@/app/crash";
import { makeT } from "@/i18n";
import { useSettings } from "@/app/settings";
import { defineStrings } from "@/i18n";
import { LineMark } from "@/ui/LineMark";

const S = defineStrings(
  {
    err_h: "Something went wrong on this screen",
    err_p: "Your data is safe in this browser. Go back to the start, or reload the page.",
    err_home: "Back to the start",
    err_reload: "Reload",
    err_details: "Technical details",
    err_copy: "Copy crash report",
    err_copied: "Copied. Paste it into a message to us.",
    err_copy_fail: "Copying did not work. Select the text below and copy it.",
    err_copy_p: "It says what went wrong and which screens came before. None of your entries are in it.",
  },
  {
    err_h: "Auf dieser Seite ist etwas schiefgegangen",
    err_p:
      "Ihre Daten sind in diesem Browser sicher. Gehen Sie zurück zum Start oder laden Sie die Seite neu.",
    err_home: "Zurück zum Start",
    err_reload: "Neu laden",
    err_details: "Technische Details",
    err_copy: "Fehlerbericht kopieren",
    err_copied: "Kopiert. Fügen Sie ihn in eine Nachricht an uns ein.",
    err_copy_fail: "Kopieren hat nicht geklappt. Markieren Sie den Text unten und kopieren Sie ihn.",
    err_copy_p: "Er sagt, was schiefging und welche Seiten davor kamen. Ihre Eingaben stehen nicht darin.",
  },
);

/** Catches a crash in one screen so the rest of the app (and the person's data) stays usable. */
export class ErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { error: Error | null; report: string; copied: "" | "ok" | "fail" }
> {
  state = { error: null as Error | null, report: "", copied: "" as "" | "ok" | "fail" };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error)
      this.setState({ error: null, report: "", copied: "" });
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error);
    crumb("crash: " + error.message);
    this.setState({ report: crashReport(error, info.componentStack) });
  }
  copy = async () => {
    const report = this.state.report || crashReport(this.state.error!);
    try {
      await navigator.clipboard.writeText(report);
      this.setState({ copied: "ok" });
    } catch {
      this.setState({ copied: "fail" });
    }
  };
  render() {
    if (!this.state.error) return this.props.children;
    const t = makeT(useSettings.getState().lang, S);
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-[560px] flex-col items-center gap-3 px-4 py-16 text-center"
      >
        <LineMark height={36} />
        <h1 className="text-heading">{t("err_h")}</h1>
        <p className="text-ink-2">{t("err_p")}</p>
        <div className="flex gap-2.5">
          <a
            href="#home"
            className="rounded-control bg-ink px-5 py-3 font-extrabold text-canvas no-underline"
          >
            {t("err_home")}
          </a>
          <button
            type="button"
            onClick={() => location.reload()}
            className="rounded-control px-5 py-3 font-extrabold shadow-[inset_0_0_0_1.5px_var(--line-2)]"
          >
            {t("err_reload")}
          </button>
        </div>
        {/* what went wrong, in words someone can copy into a message: never the person's data (crash.ts) */}
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => void this.copy()}
            className="rounded-control px-5 py-3 font-extrabold shadow-[inset_0_0_0_1.5px_var(--line-2)]"
          >
            {t("err_copy")}
          </button>
          <p className="text-small text-ink-3" role="status">
            {this.state.copied === "ok"
              ? t("err_copied")
              : this.state.copied === "fail"
                ? t("err_copy_fail")
                : t("err_copy_p")}
          </p>
        </div>
        <details className="w-full text-left text-small text-ink-3" open={this.state.copied === "fail"}>
          <summary className="cursor-pointer text-center font-bold">{t("err_details")}</summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-tile bg-surface-2 p-3 text-caption break-words whitespace-pre-wrap select-all">
            {this.state.report || crashReport(this.state.error)}
          </pre>
        </details>
      </div>
    );
  }
}
