import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

const ex = JSON.parse(readFileSync(new URL("../src/data/examples.json", import.meta.url), "utf8"));

/** Start with a sample profile (or empty) in a language, before the app loads. */
export async function seed(
  page: Page,
  opts: { sample?: string; lang?: "en" | "de"; theme?: "light" | "dark" } = {},
) {
  const lang = opts.lang ?? "en";
  const doc = opts.sample ? { ...ex.examples[opts.sample][lang], example: opts.sample } : null;
  await page.addInitScript(
    ([d, l, t]) => {
      if (sessionStorage.getItem("__seeded")) return;
      sessionStorage.setItem("__seeded", "1");
      localStorage.clear();
      localStorage.setItem("a2j:lang", l as string);
      if (t) localStorage.setItem("a2j:theme", t as string);
      if (d) localStorage.setItem("a2j:v2", JSON.stringify(d));
    },
    [doc, lang, opts.theme ?? null] as const,
  );
}

/** Collect page errors and console errors. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}
