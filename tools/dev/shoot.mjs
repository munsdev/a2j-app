// Screenshot a screen of the app, optionally with a sample profile loaded.
//
//   node tools/dev/shoot.mjs --hash goals --sample holmes --lang de --width 390 --dark --out shot.png
//
// Serve the app with `npm run build && npm run preview` (port 8765), or pass --base for another server.
// --click "<css>" clicks before the shot (repeatable); --full shoots the whole page; --wait ms.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf("--" + k);
  return i < 0 ? d : args[i + 1];
};
const flag = (k) => args.includes("--" + k);
const clicks = args.flatMap((a, i) => (a === "--click" ? [args[i + 1]] : []));

const base = opt("base", "http://localhost:8765/");
const hash = opt("hash", "home");
const sample = opt("sample", "");
const lang = opt("lang", "en");
const width = +opt("width", "1280");
const height = +opt("height", width < 700 ? "844" : "860");
const out = opt("out", "shot.png");
const wait = +opt("wait", "1500");

const ex = JSON.parse(readFileSync(new URL("../../src/data/examples.json", import.meta.url), "utf8"));
const doc = sample ? { ...ex.examples[sample][lang], example: sample } : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, colorScheme: flag("dark") ? "dark" : "light" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.addInitScript(
  ([d, l]) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.clear();
    localStorage.setItem("a2j:lang", l);
    if (d) localStorage.setItem("a2j:v2", JSON.stringify(d));
  },
  [doc, lang],
);
await page.goto(base + "#" + hash);
await page.waitForTimeout(wait);
for (const c of clicks) {
  await page.click(c);
  await page.waitForTimeout(500);
}
await page.screenshot({ path: out, fullPage: flag("full") });
if (errors.length) console.log("page errors:\n" + errors.join("\n"));
await browser.close();
