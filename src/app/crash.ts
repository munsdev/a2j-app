import { getDoc } from "@/data/store";
import { useSettings } from "./settings";
import { getRoute, onRouteChange } from "./router";

/* =================== THE CRASH REPORT ===================
   What the error screen copies, for the person to paste into a message: the error and where in the code, the
   app version, the last screens and errors before it, and the size of the data. Never the person's data: no
   names, titles or text they typed, only counts. Kept in memory only, never sent anywhere. */

declare const __BUILD__: string;
const BUILD = typeof __BUILD__ === "string" ? __BUILD__ : "dev";

const MAX = 25;
const crumbs: string[] = [];
const t0 = Date.now();
const stamp = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

/** Note something that happened (a screen, an error), for the report. */
export function crumb(what: string): void {
  // React tries a failed render again: the same note twice in a row says nothing new
  if (crumbs.at(-1)?.endsWith(" " + what)) return;
  crumbs.push(`${stamp()} ${what}`);
  if (crumbs.length > MAX) crumbs.shift();
}

/** Start noting screens and stray errors. Call once at start. */
export function initCrash(): void {
  crumb("open #" + getRoute().path);
  onRouteChange(() => crumb("screen #" + getRoute().path));
  window.addEventListener("error", (e) => crumb("error: " + (e.message || String(e.error))));
  window.addEventListener("unhandledrejection", (e) =>
    crumb("rejection: " + (e.reason instanceof Error ? e.reason.message : String(e.reason))),
  );
}

/** The size of the data, without any of it. */
function dataShape(): string {
  try {
    const d = getDoc();
    const roles = { done: 0, goal: 0, maybe: 0 } as Record<string, number>;
    d.jobs.forEach((j) => (roles[j.role] = (roles[j.role] ?? 0) + 1));
    const noMatch = d.jobs.filter((j) => j.occ == null).length;
    return [
      `jobs done ${roles.done}, goals ${roles.goal}, shortlist ${roles.maybe}, unmatched ${noMatch}`,
      `courses ${d.courses.length}, ads ${d.jobads.length}, routes ${d.routes.length}`,
      `skills rated ${Object.keys(d.esco.rated).length}, votes ${d.esco.votes.length}`,
      d.example ? `sample ${d.example}` : "own data",
    ].join("; ");
  } catch (e) {
    return "data unreadable: " + String(e);
  }
}

/** The report for an error, as plain text. */
export function crashReport(error: Error, componentStack?: string | null): string {
  const s = useSettings.getState();
  return [
    "A2J crash report",
    `${error.name}: ${error.message}`,
    ...(error.stack ?? "")
      .split("\n")
      .slice(1, 9)
      .map((l) => "  " + l.trim()),
    ...(componentStack
      ? [
          "Components:",
          ...componentStack
            .trim()
            .split("\n")
            .slice(0, 8)
            .map((l) => "  " + l.trim()),
        ]
      : []),
    "",
    `Version ${BUILD} · ${new Date().toISOString()}`,
    `Screen #${location.hash.slice(1)} · ${s.lang} · ${s.theme} · ${innerWidth}×${innerHeight}`,
    navigator.userAgent,
    "Data: " + dataShape(),
    "",
    "Before:",
    ...crumbs.map((c) => "  " + c),
  ].join("\n");
}
