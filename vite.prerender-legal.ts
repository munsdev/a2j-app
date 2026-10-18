import { readFile, writeFile } from "node:fs/promises";
import { createElement, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer, type Plugin } from "vite";

/* The legal pages must be readable without JavaScript (a legal notice that needs scripts is not "easily
   reachable"). After the build, render each page's text (both languages, German first, as the binding
   version) into its HTML. When scripts run, React replaces it with the interactive page. */

const PAGES = [
  { file: "impressum", de: "ImpressumDe", en: "ImpressumEn" },
  { file: "datenschutz", de: "DatenschutzDe", en: "DatenschutzEn" },
  { file: "credits", de: "CreditsDe", en: "CreditsEn" },
];

export function prerenderLegal(): Plugin {
  let outDir = "dist";
  return {
    name: "a2j:prerender-legal",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    async closeBundle() {
      // a bare Vite server only to load the .tsx content modules (they import nothing)
      const server = await createServer({
        configFile: false,
        logLevel: "error",
        appType: "custom",
        server: { middlewareMode: true, hmr: false, ws: false },
        optimizeDeps: { noDiscovery: true, entries: [] },
        esbuild: { jsx: "automatic" },
      });
      try {
        for (const p of PAGES) {
          const mod = (await server.ssrLoadModule(`/src/legal/${p.file}.content.tsx`)) as Record<
            string,
            FunctionComponent
          >;
          if (!mod[p.de] || !mod[p.en])
            throw new Error(`prerender-legal: ${p.file} exports ${p.de}/${p.en}?`);
          const body =
            `<article class="legal" lang="de" style="max-width:760px;margin:0 auto;padding:32px 16px 0">${renderToStaticMarkup(createElement(mod[p.de]))}</article>` +
            `<article class="legal" lang="en" style="max-width:760px;margin:0 auto;padding:32px 16px 48px">${renderToStaticMarkup(createElement(mod[p.en]))}</article>`;
          const path = `${outDir}/${p.file}.html`;
          const html = await readFile(path, "utf8");
          if (!html.includes('<div id="root"></div>'))
            throw new Error(`prerender-legal: no #root in ${path}`);
          await writeFile(path, html.replace('<div id="root"></div>', `<div id="root">${body}</div>`));
        }
      } finally {
        await server.close();
      }
    },
  };
}
