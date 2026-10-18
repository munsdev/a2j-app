import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seed, watchErrors } from "./helpers";

/* Every screen opens without errors and passes an automated WCAG 2.1 AA scan, empty and with a sample,
   in both languages and both themes. */
const SCREENS = [
  "home",
  "profile",
  "goals",
  "goals/ideas",
  "goals/compare",
  "plan",
  "edit/profile",
  "edit/jobs",
  "backup",
];

for (const sample of ["", "holmes"]) {
  for (const [lang, theme] of [
    ["en", "light"],
    ["de", "dark"],
  ] as const) {
    for (const hash of SCREENS) {
      test(`${hash} · ${sample || "empty"} · ${lang} · ${theme}`, async ({ page }) => {
        await seed(page, { sample: sample || undefined, lang, theme });
        const errors = watchErrors(page);
        await page.goto("#" + hash);
        await expect(page.locator("main h1, main h2").first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(400);
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const violations = scan.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        );
        expect(violations, "accessibility violations").toEqual([]);
        expect(errors, "console errors").toEqual([]);
      });
    }
  }
}

test("the job page of every saved job opens", async ({ page }) => {
  await seed(page, { sample: "robin" });
  const errors = watchErrors(page);
  for (const id of ["j1", "j2", "j3", "j4", "j5"]) {
    await page.goto("#goals/job/" + id);
    await expect(page.locator("main")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("legal pages render in both languages", async ({ page }) => {
  for (const p of ["impressum.html", "datenschutz.html", "credits.html"]) {
    await page.goto(p);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});
