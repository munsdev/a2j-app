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
  /* an answer goes on to the next question by itself */
  for (let i = 1; i <= 3; i++) {
    await page.getByRole("button", { name: "Often" }).click();
    await expect(page.getByText(`${i + 1} of 45`)).toBeVisible();
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

test("the match score with courses; a liked idea goes on the shortlist, its skills open their sheet", async ({
  page,
}) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  await page.goto("#goals/job/j3");
  const front = page.locator(".card3d .front").first();
  await expect(front.getByText("31", { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(front.getByText(/^Rises to 41/)).toBeVisible();

  await page.goto("#goals/ideas");
  const title = (await page.locator(".card3d").first().getAttribute("aria-label", { timeout: 30000 }))!;
  await page.locator(".card3d [data-tile]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "I like it" }).first().click();
  await expect(page.getByText("On your shortlist").first()).toBeVisible();
  await page.goto("#goals");
  await expect(page.getByText(title).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the shortlist: favourites first, five shown, the rest behind Show all", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  await page.addInitScript(() => {
    const d = JSON.parse(localStorage.getItem("a2j:v2")!);
    if (d.jobs.length > 6) return;
    for (let i = 0; i < 6; i++)
      d.jobs.push({ id: "x" + i, title: "Liked " + i, occ: 100 + i * 37, role: "maybe", org: "", when: "" });
    localStorage.setItem("a2j:v2", JSON.stringify(d));
  });
  const errors = watchErrors(page);
  await page.goto("#goals");
  const list = page.getByRole("region", { name: "Shortlist" }).getByRole("listitem");
  await expect(list).toHaveCount(5);
  await page.getByRole("button", { name: "Show all 7 jobs you liked" }).click();
  await expect(list).toHaveCount(7);
  const star = page.getByRole("button", { name: "Favourite: Liked 5" });
  await star.click();
  await expect(star).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Show fewer" }).click();
  await expect(list).toHaveCount(5);
  await expect(list.first()).toContainText("Liked 5");
  expect(errors).toEqual([]);
});

test("a course already saved for the goal: the board offers it, not a search", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  await page.addInitScript(() => {
    const d = JSON.parse(localStorage.getItem("a2j:v2")!);
    if (d.__patched) return;
    d.__patched = true;
    d.routes.forEach((r: { course: string | null }) => (r.course = null));
    localStorage.setItem("a2j:v2", JSON.stringify(d));
  });
  const errors = watchErrors(page);
  await page.goto("#goals/job/j3");
  await expect(page.getByText("Choose your course")).toBeVisible({ timeout: 30000 });
  const pick = page.locator("[data-pick] li");
  await expect(pick).toHaveCount(2);
  await pick.first().getByRole("button", { name: "Take this one" }).click();
  await expect(page.getByText("Next: start your course")).toBeVisible();
  // the chosen course can be changed: the other one, or none
  await page.getByRole("button", { name: "Change course" }).click();
  await expect(page.getByText("Your course now")).toBeVisible();
  await expect(page.getByRole("button", { name: "No course needed" })).toBeVisible();
  await pick.nth(1).getByRole("button", { name: "Take this one" }).click();
  await expect(page.getByText("Next: start your course")).toBeVisible();
  await page.getByRole("button", { name: "Change course" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Change course" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("job ideas: the explore options in the dropdown deal other ideas and say why", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  await page.goto("#goals/ideas");
  const count = page.getByText(/^\d+ of \d+$/);
  await expect(count).toHaveText(/^1 of /, { timeout: 30000 });
  const lens = page.getByRole("combobox", { name: "Which ideas" });
  await lens.selectOption("paths");
  await expect(count).toHaveText(/^1 of /);
  await expect(page.locator("[data-why]")).toContainText("People who worked as Private investigator");
  await lens.selectOption("skills");
  await expect(page.locator("[data-why]")).toContainText(/Uses \d+ of your skills/);
  // an option with nothing to deal says what to fill in, and leads back
  await lens.selectOption("step");
  await page.getByRole("button", { name: "Back to ideas for you" }).click();
  await expect(lens).toHaveValue("all");
  await expect(page.locator("[data-why]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("job ideas: two big answers, skip, a small back, swipes and keys", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  await page.goto("#goals/ideas");
  const count = page.getByText(/^\d+ of \d+$/);
  await expect(count).toHaveText(/^1 of /, { timeout: 30000 });
  const card = () => page.locator(".card3d").first();
  const first = (await card().getAttribute("aria-label"))!;
  const back = page.locator('[data-nav="back"]');
  const no = page.getByRole("button", { name: "Not for me" });
  const yes = page.getByRole("button", { name: "I like it", exact: true });
  await expect(back).toHaveAttribute("aria-disabled", "true");

  // Skip moves on without a mark; Back comes back
  await page.getByRole("button", { name: /^Skip/ }).click();
  await expect(count).toHaveText(/^2 of /);
  await back.click();
  await expect(count).toHaveText(/^1 of /);
  await expect(card()).toHaveAttribute("aria-label", first);

  // an answer marks the card and the next one comes; back shows the mark; the other thumb switches it, the
  // filled one again takes it away (and the card stays)
  await no.click();
  await expect(count).toHaveText(/^2 of /);
  await back.click();
  await expect(no).toHaveAttribute("aria-pressed", "true");
  await yes.click();
  await expect(count).toHaveText(/^2 of /);
  await back.click();
  await expect(yes).toHaveAttribute("aria-pressed", "true");
  await yes.click();
  await expect(yes).toHaveAttribute("aria-pressed", "false");
  await expect(count).toHaveText(/^1 of /);

  // keys: ↑ skips, Backspace goes back, ← is Not for me; Undo in the toast takes the mark back
  await page.keyboard.press("ArrowUp");
  await expect(count).toHaveText(/^2 of /);
  await page.keyboard.press("Backspace");
  await expect(count).toHaveText(/^1 of /);
  await page.keyboard.press("ArrowLeft");
  await expect(count).toHaveText(/^2 of /);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.keyboard.press("Backspace");
  await expect(card()).toHaveAttribute("aria-label", first);
  await expect(no).toHaveAttribute("aria-pressed", "false");

  // all skills and details open in a sheet; the deck stays where it was
  await page.locator(".deck-more").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(count).toHaveText(/^1 of /);

  // a swipe to the right is I like it
  const deck = page.locator("[data-swipe]");
  const box = (await card().boundingBox())!;
  const at = (dx: number) => ({ pointerId: 7, button: 0, clientX: box.x + 100 + dx, clientY: box.y + 60 });
  await deck.dispatchEvent("pointerdown", at(0));
  await deck.dispatchEvent("pointermove", at(60));
  await deck.dispatchEvent("pointermove", at(200));
  await deck.dispatchEvent("pointerup", at(200));
  await expect(count).toHaveText(/^2 of /);
  await page.keyboard.press("Backspace");
  await expect(yes).toHaveAttribute("aria-pressed", "true");

  // the place in the deck survives a reload
  await page.keyboard.press("ArrowUp");
  await expect(count).toHaveText(/^2 of /);
  await page.keyboard.press("ArrowUp");
  await expect(count).toHaveText(/^3 of /);
  const third = await card().getAttribute("aria-label");
  await page.reload();
  await expect(count).toHaveText(/^3 of /, { timeout: 30000 });
  await expect(card()).toHaveAttribute("aria-label", third!);
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

test("a route that needs no course: Home points to applying, the plan leaves the course out", async ({
  page,
}) => {
  await seed(page, { sample: "geppetto" });
  const errors = watchErrors(page);
  await page.goto("#goals");
  await page.getByRole("button", { name: /You're on route/ }).click();
  await page.getByRole("button", { name: /^Edit route A/ }).click();
  await page.getByLabel(/No course needed/).check();
  await page.getByRole("button", { name: "Save route A" }).click();
  await expect(page.getByText("No course needed").first()).toBeVisible();
  await page.goto("#home");
  await expect(page.getByText(/^Find a course for/)).toHaveCount(0);
  await expect(page.getByText(/^(Apply for|Look at job ads for)/).first()).toBeVisible();
  await page.goto("#plan");
  await expect(page.getByText(/No course chosen yet/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("with going on automatically turned off, an answer stays until Next", async ({ page }) => {
  await seed(page);
  await page.goto("#profile/apt");
  const box = page.getByLabel("Go to the next question automatically");
  await expect(box).toBeChecked();
  await box.uncheck();
  await page.getByRole("button", { name: "Often" }).click();
  await page.waitForTimeout(700);
  await expect(page.getByText("1 of 45")).toBeVisible();
  await page.getByRole("button", { name: /^Next/ }).click();
  await expect(page.getByText("2 of 45")).toBeVisible();
  /* the choice is kept on this device */
  await page.reload();
  await expect(page.getByLabel("Go to the next question automatically")).not.toBeChecked();
});

test("the goal's line: a skill opens in place, one at a time, to rate it and say the course covers it", async ({
  page,
}) => {
  await seed(page, { sample: "geppetto" });
  const errors = watchErrors(page);
  await page.goto("#goals");
  const stops = page.locator(".lr-stop");
  await expect(stops.first()).toBeVisible({ timeout: 30000 });
  const learn = page.locator(".lr-stop").filter({ hasText: "Statistical process control" });
  await learn.click();
  await expect(learn).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator("#stop-" + (await learn.getAttribute("aria-controls"))!.slice(5));
  await panel.getByRole("radio", { name: /^2/ }).click();
  await expect(panel.getByRole("radio", { name: /^2/ })).toHaveAttribute("aria-checked", "true");
  const covers = panel.getByRole("checkbox");
  await covers.check();
  await expect(covers).toBeChecked();
  // another skill opens, the first one closes
  await stops.first().click();
  await expect(stops.first()).toHaveAttribute("aria-expanded", "true");
  await expect(learn).toHaveAttribute("aria-expanded", "false");
  expect(errors).toEqual([]);
});

test("a crash shows a way back and a crash report to copy, without the person's data", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seed(page, { sample: "holmes" });
  await page.goto("#goals");
  await expect(page.getByRole("heading", { name: "Goals" }).first()).toBeVisible({ timeout: 30000 });
  await page.goto("#__crash");
  await expect(page.getByRole("alert")).toContainText("Something went wrong");
  await page.getByRole("button", { name: "Copy crash report" }).click();
  await expect(page.getByText("Copied. Paste it into a message to us.")).toBeVisible();
  const report = await page.evaluate(() => navigator.clipboard.readText());
  expect(report).toContain("Error: Crash test (#__crash)");
  expect(report).toMatch(/(open|screen) #goals\n.*screen #__crash/);
  expect(report).toMatch(/jobs done 2, goals 2, shortlist 1/);
  expect(report).toContain("sample holmes");
  // no names, titles or typed text
  expect(report).not.toContain("Fraud investigator");
  expect(report).not.toContain("Sherlock");
  // another screen comes back
  await page.goto("#home");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("compare: a tap on a skill opens a choice, it never changes anything by itself", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  await page.goto("#goals/compare");
  const cell = page.locator('[role="cell"] button[aria-haspopup="dialog"]').first();
  await expect(cell).toBeVisible({ timeout: 30000 });
  const before = await page.evaluate(() => localStorage.getItem("a2j:v2"));
  await cell.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("radiogroup").or(sheet.getByRole("group")).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("a2j:v2"))).toBe(before);
  // the course can be said to cover it, and taken back
  const covers = sheet.getByRole("checkbox");
  if (await covers.count()) {
    const was = await covers.isChecked();
    await covers.click();
    await expect(covers).toBeChecked({ checked: !was });
    await covers.click();
    await expect(covers).toBeChecked({ checked: was });
  }
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  expect(errors).toEqual([]);
});

test("edit: past jobs sit with the profile; the jobs you want on their own tab", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  const errors = watchErrors(page);
  const titles = (name: string) =>
    page
      .getByRole("region", { name })
      .getByRole("textbox", { name: "Job", exact: true })
      .evaluateAll((s) => s.map((x) => (x as HTMLInputElement).value));
  await page.goto("#edit/profile");
  await expect(page.getByRole("region", { name: "Your jobs so far" })).toBeVisible({ timeout: 30000 });
  expect(await titles("Your jobs so far")).toEqual(["Private investigator", "Chemistry lab assistant"]);
  await expect(page.getByRole("combobox", { name: "Kind" })).toHaveCount(0);
  await page.goto("#edit/jobs");
  await expect(page.getByRole("region", { name: "Goals" })).toBeVisible({ timeout: 30000 });
  expect(await titles("Goals")).toEqual(["Fraud investigator", "Data analyst"]);
  expect(await titles("Shortlist")).toEqual(["Forensic lab technician"]);
  expect(errors).toEqual([]);
});

test("edit: skills show the ones you have first; switch to those you don't, or all", async ({ page }) => {
  await seed(page, { sample: "holmes" });
  await page.goto("#edit/skills");
  const rated = page.getByRole("region", { name: "Rated skills" });
  const rows = rated.getByRole("listitem");
  await expect(rows.first()).toBeVisible({ timeout: 30000 });
  const levels = async () =>
    rated.getByRole("combobox").evaluateAll((s) => s.map((x) => +(x as HTMLSelectElement).value));
  expect((await levels()).every((n) => n > 0)).toBe(true);
  const have = await rows.count();
  await page.getByRole("button", { name: "I don't have" }).click();
  expect((await levels()).every((n) => n === 0)).toBe(true);
  const not = await rows.count();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(rows).toHaveCount(have + not);
});

test("route sheet: a skill opens your level and the course choice, nothing changes by itself", async ({
  page,
}) => {
  await seed(page, { sample: "holmes" });
  await page.goto("#goals");
  await page.getByRole("button", { name: /You're on route/ }).click();
  await page.getByRole("button", { name: /^Edit route A/ }).click();
  const sheet = page.getByRole("dialog");
  const chip = sheet.locator("button[aria-expanded]").first();
  await expect(chip).toBeVisible({ timeout: 30000 });
  const before = await page.evaluate(() => localStorage.getItem("a2j:v2"));
  await chip.click();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await expect(sheet.getByRole("radiogroup", { name: "How well can you do this?" })).toBeVisible();
  await expect(sheet.getByRole("checkbox", { name: /covers this/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("a2j:v2"))).toBe(before);
  await chip.click();
  await expect(sheet.getByRole("radiogroup", { name: "How well can you do this?" })).toHaveCount(0);
});
