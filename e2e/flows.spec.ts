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
  await expect(front.getByText(/^Rises to 41/)).toBeVisible();

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

test("browse the job ideas: next and back, and change a mark on a card seen before", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  await page.goto("#goals/ideas");
  const count = page.getByText(/^\d+ of \d+$/);
  await expect(count).toHaveText(/^1 of /, { timeout: 30000 });
  const first = (await page.locator(".card3d").first().getAttribute("aria-label"))!;
  const back = page.getByRole("button", { name: "Back", exact: true });
  await expect(back).toHaveAttribute("aria-disabled", "true");

  // Next and the arrow keys move through the deck; nothing is used up
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(count).toHaveText(/^2 of /);
  await page.keyboard.press("ArrowLeft");
  await expect(count).toHaveText(/^1 of /);
  await expect(page.locator(".card3d").first()).toHaveAttribute("aria-label", first);

  // "Not for me" marks the card and goes on; going back shows the mark, which can be changed
  await page.getByRole("button", { name: "Not for me" }).first().click();
  await expect(count).toHaveText(/^2 of /);
  await back.click();
  await expect(count).toHaveText(/^1 of /);
  const card = page.locator(".card3d").first();
  await expect(card).toHaveAttribute("aria-label", first);
  await expect(card.getByText("Not for me")).toBeVisible();
  await page.getByRole("button", { name: "Remove the mark" }).first().click();
  await expect(page.getByRole("button", { name: "I like it", exact: true }).first()).toBeVisible();

  // the letter key marks too, and the toast's Undo takes the mark back; the card keeps its place
  await page.keyboard.press("n");
  await expect(count).toHaveText(/^2 of /);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".card3d").first()).toHaveAttribute("aria-label", first);
  await expect(page.locator(".card3d").first().getByText("Not for me")).toBeHidden();

  // the place in the deck survives a reload
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(count).toHaveText(/^3 of /);
  const third = await page.locator(".card3d").first().getAttribute("aria-label");
  await page.reload();
  await expect(count).toHaveText(/^3 of /, { timeout: 30000 });
  await expect(page.locator(".card3d").first()).toHaveAttribute("aria-label", third!);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".card3d").first()).toHaveAttribute("aria-label", first);
  expect(errors).toEqual([]);
});

test("phone back inside a part goes back a step, and leaves for the overview from the first", async ({
  page,
}) => {
  await seed(page);
  await page.goto("#profile");
  await page.goto("#profile/apt");
  await expect(page.getByText("1 of 45")).toBeVisible();
  await page.getByRole("button", { name: "Often" }).click();
  await page.getByRole("button", { name: /^Next/ }).click();
  await expect(page.getByText("2 of 45")).toBeVisible();
  await page.goBack();
  await expect(page.getByText("1 of 45")).toBeVisible();
  await expect(page).toHaveURL(/#profile\/apt$/);
  await page.goBack();
  await expect(page).toHaveURL(/#profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a work-setting scale starts in the middle, and Next keeps it", async ({ page }) => {
  await seed(page);
  await page.goto("#profile/set");
  await expect(page.getByRole("radio", { name: "Either" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "Doesn't matter" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Next/ }).click();
  await expect(page.getByText("2 of 7")).toBeVisible();
  await page.getByRole("button", { name: /^Back/ }).click();
  await expect(page.getByRole("radio", { name: "Either" })).toHaveAttribute("aria-checked", "true");
});
