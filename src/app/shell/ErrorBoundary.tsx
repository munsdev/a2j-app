import { Component, type ReactNode } from "react";
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
    err_details: "Technical details (to report the problem)",
  },
  {
    err_h: "Auf dieser Seite ist etwas schiefgegangen",
    err_p:
      "Ihre Daten sind in diesem Browser sicher. Gehen Sie zurück zum Start oder laden Sie die Seite neu.",
    err_home: "Zurück zum Start",
    err_reload: "Neu laden",
    err_details: "Technische Details (um das Problem zu melden)",
  },
);

/** Catches a crash in one screen so the rest of the app (and the person's data) stays usable. */
export class ErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
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
        {/* what went wrong, in words someone can copy into a message: only the error, never the person's data */}
        <details className="mt-2 w-full text-left text-small text-ink-3">
          <summary className="cursor-pointer text-center font-bold">{t("err_details")}</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-tile bg-surface-2 p-3 text-caption break-words whitespace-pre-wrap select-all">
            {[this.state.error.name + ": " + this.state.error.message]
              .concat((this.state.error.stack ?? "").split("\n").slice(1, 6))
              .concat(["", location.hash.split("/")[0], navigator.userAgent])
              .join("\n")}
          </pre>
        </details>
      </div>
    );
  }
}
