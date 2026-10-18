import { createElement, type FC } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImpressumDe, ImpressumEn } from "./impressum.content";
import { DatenschutzDe, DatenschutzEn } from "./datenschutz.content";
import { CreditsDe, CreditsEn } from "./credits.content";

/* The legal pages: both languages say the same things (same sections), the required details are there, and no
   text points to a screen or file the app no longer has. Wording changes are made on purpose and reviewed. */

const html = (C: FC) => renderToStaticMarkup(createElement(C));
const headings = (h: string) => [...h.matchAll(/<h2>/g)].length;

const PAGES: [string, FC, FC][] = [
  ["impressum", ImpressumDe, ImpressumEn],
  ["datenschutz", DatenschutzDe, DatenschutzEn],
  ["credits", CreditsDe, CreditsEn],
];

/* names of screens, buttons and folders that existed in earlier versions only */
const GONE = [
  /Profil leeren/,
  /Clear my profile/,
  /„Wege“/,
  /Under (&quot;|")Paths/,
  /Mappe/,
  /Ordner <code>fonts/,
  /the <code>fonts<\/code> folder/,
];

describe("legal pages", () => {
  for (const [name, De, En] of PAGES)
    it(`${name}: both languages have the same sections and no outdated references`, () => {
      const de = html(De);
      const en = html(En);
      expect(headings(de)).toBe(headings(en));
      for (const re of GONE) {
        expect(de).not.toMatch(re);
        expect(en).not.toMatch(re);
      }
    });

  it("legal notice and privacy policy name the responsible person and how to reach them", () => {
    for (const C of [ImpressumDe, ImpressumEn, DatenschutzDe, DatenschutzEn]) {
      const h = html(C);
      expect(h).toContain("Casey Muns");
      expect(h).toContain("82152 Planegg");
      expect(h).toContain("casey@muns.dev");
    }
  });

  it("links point only at pages and files the build ships, or at https sites", () => {
    const shipped = new Set(["credits.html", "licenses.txt", "impressum.html", "datenschutz.html"]);
    for (const [, De, En] of PAGES)
      for (const C of [De, En])
        for (const [, href] of html(C).matchAll(/href="([^"]+)"/g))
          expect(shipped.has(href) || href.startsWith("https://"), href).toBe(true);
  });
});
