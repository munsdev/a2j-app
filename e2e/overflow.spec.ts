import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

/* No screen may scroll sideways on a small phone, in either language (German words and gendered job titles
   are long). Runs once, at 360px, outside the phone/desktop projects. */
const ROUTES = [
  "home",
  "profile",
  "profile/apt",
  "profile/set",
  "profile/val",
  "profile/story",
  "profile/skills",
  "goals",
  "goals/ideas",
  "goals/compare",
  "goals/job/j1",
  "goals/job/j4",
  "plan",
  "edit/profile",
  "edit/jobs",
  "edit/skills",
  "backup",
];

test.describe("no sideways scrolling at 360px", () => {
  for (const lang of ["de", "en"] as const)
    for (const sample of ["geppetto", "holmes"])
      test(`${sample} · ${lang}`, async ({ page }) => {
        test.setTimeout(120_000);
        test.skip(test.info().project.name !== "phone", "phone only");
        await page.setViewportSize({ width: 360, height: 760 });
        await seed(page, { sample, lang });
        const wide: string[] = [];
        for (const r of ROUTES) {
          await page.goto("#" + r);
          await page.waitForTimeout(r.startsWith("goals") || r.startsWith("profile/skills") ? 1200 : 300);
          const w = await page.evaluate(() => document.documentElement.scrollWidth);
          if (w > 360) wide.push(`${r}: ${w}px`);
        }
        expect(wide).toEqual([]);
      });
});
