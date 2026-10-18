import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

/* The licence notices of everything shipped to the browser (code libraries and fonts), written to licenses.txt
   on every build so the list never goes stale. MIT, Apache-2.0 and the SIL Open Font License all require the
   notice to travel with the software. Linked from the Data sources page. */

const ROOT = process.cwd();
const FIXED = [
  "react",
  "react-dom",
  "scheduler",
  "radix-ui",
  "zustand",
  "immer",
  "clsx",
  "tailwind-merge",
  "class-variance-authority",
  "tailwindcss",
  "@fontsource-variable/fredoka",
  "@fontsource-variable/nunito",
];
const scoped = (scope: string, filter: (n: string) => boolean = () => true) =>
  existsSync(join(ROOT, "node_modules", scope))
    ? readdirSync(join(ROOT, "node_modules", scope))
        .filter(filter)
        .map((n) => `${scope}/${n}`)
    : [];

function notice(name: string): string | null {
  const dir = join(ROOT, "node_modules", name);
  if (!existsSync(join(dir, "package.json"))) return null;
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
    version: string;
    license?: string;
  };
  const file = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
  const text = file
    ? readFileSync(join(dir, file), "utf8").trim()
    : `License: ${pkg.license ?? "see package"}`;
  return `${name} ${pkg.version} (${pkg.license ?? "see text"})\n${"-".repeat(72)}\n${text}\n`;
}

export function licenses(): Plugin {
  return {
    name: "a2j:licenses",
    apply: "build",
    generateBundle() {
      const names = [
        ...FIXED,
        ...scoped("@radix-ui"),
        ...readdirSync(join(ROOT, "node_modules")).filter((n) => n.startsWith("workbox-")),
      ];
      const parts = [...new Set(names)].sort().map(notice).filter(Boolean);
      this.emitFile({
        type: "asset",
        fileName: "licenses.txt",
        source:
          "From A to Job · a2j.app: licences of the software and fonts shipped with this site.\n" +
          "Data sources (ESCO, O*NET) are credited on the Data sources page.\n\n" +
          parts.join("\n"),
      });
    },
  };
}
