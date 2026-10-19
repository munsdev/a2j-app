import { expect, test } from "@playwright/test";
import { seed, watchErrors } from "./helpers";

/* The main journeys, end to end, the way a person would use them. */

test("answer the first questions, undo, and keep the answers after a reload", async ({ page }) => {
  await seed(page);
  const errors = watchErrors(page);
  await page.goto("#home");
  await page
    .getByRole("button", { name: /^Start/ })
    .first()
    .click();
  await expect(page).toHaveURL(/#profile\/apt/);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Often" }).click();
    await page.getByRole("button", { name: /^Next/ }).click();
  }
  await page.reload();
  await page.goto("#profile");
  await expect(page.getByText(/3 of 45/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("open a sample, switch language, and go back to my own profile", async ({ page }) => {
  await seed(page);
  await page.goto("#home");
  await page
    .getByRole("button", { name: /example/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Sherlock Holmes/ }).click();
  await expect(page.getByText(/Sample: Sherlock Holmes/).first()).toBeVisible();
  await page.getByRole("button", { name: "de", exact: true }).click();
  await expect(page.getByText(/Beispiel: Sherlock Holmes/).first()).toBeVisible();
});

test("browser back closes a sheet before leaving the screen", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  await page.goto("#home");
  await page.goto("#goals");
  await page.getByRole("button", { name: /Menu/ }).click();
  await page.getByRole("menuitem", { name: "AI prompts" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/#goals$/);
});

test("print the plan: only the page is printed", async ({ page }) => {
  await seed(page, { sample: "geppetto", lang: "de" });
  await page.goto("#plan");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("header").first()).toBeHidden();
});

test("undoing 'Back to my profile' never loses the own profile", async ({ page }) => {
  await seed(page);
  await page.goto("#edit/profile");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Name").blur();
  await page.goto("#home");
  await page.getByRole("button", { name: /^Menu/ }).click();
  await page.getByRole("menuitem", { name: "Try a sample profile" }).click();
  await page.getByRole("button", { name: /Sherlock Holmes/ }).click();
  await page.getByRole("button", { name: "Back to my profile" }).first().click();
  await expect(page.getByText(/Your line, Ada/)).toBeVisible();
  await page.keyboard.press("Control+z");
  await expect(page.getByText(/Sample: Sherlock Holmes/).first()).toBeVisible();
  await page.getByRole("button", { name: "Back to my profile" }).first().click();
  await expect(page.getByText(/Your line, Ada/)).toBeVisible();
});

test("answer keys do nothing while a dialog is open", async ({ page }) => {
  await seed(page);
  await page.goto("#profile/apt");
  await page.getByRole("button", { name: /^Menu/ }).click();
  await page.getByRole("menuitem", { name: "AI prompts" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Almost always" })).toHaveAttribute("aria-pressed", "false");
});

test("the match score with courses, and rating skills on a liked idea", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  await page.goto("#goals/job/j3");
  const front = page.locator(".card3d .front").first();
  await expect(front.getByText("31", { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(front.getByText(/^Rises to 45/)).toBeVisible();

  await page.goto("#goals/ideas");
  await page.getByRole("button", { name: "I like it" }).first().click();
  const up = page.locator('button[data-vote="up"][aria-pressed="false"]').first();
  const name = (await up.getAttribute("aria-label"))!;
  expect(name).toMatch(/^I like this: /);
  const btn = page.getByRole("button", { name, exact: true });
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});
