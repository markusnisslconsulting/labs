/**
 * The number beside a slider follows its thumb.
 *
 * It did not. Slider put `defaultValue` on the input and held nothing of
 * its own, so an uncontrolled slider showed `defaultValue ?? min` for
 * ever. Measured by pressing ArrowRight five times: the input read 25 and
 * the label beside it still read 20. `showValue` defaults to true and
 * every story in the catalogue is uncontrolled, so every slider in the
 * documentation displayed a number that had stopped being true.
 *
 * This lives here rather than in a play function, and that is not a
 * preference. The first version was a story, and it failed with the fix
 * in place: `userEvent.keyboard` dispatches untrusted events, and a
 * browser only runs a range input's native arrow-key behaviour for
 * trusted ones. The interaction runner could move the label and never the
 * thumb, which is the opposite of the bug. Playwright presses real keys.
 *
 * The assertion is on the two readings together. The input was always
 * right; a test that read only the input would have passed throughout.
 */
import { test, expect } from "@playwright/test";
import { openStory } from "./ready";

test("an uncontrolled slider's reading follows its thumb", async ({ page }) => {
  await openStory(page, "components-slider--matrix");

  const field = page.locator(".uix-field").first();
  const range = field.locator("input[type=range]");
  const shown = field.locator(".uix-field-aside");

  await expect(range).toHaveValue("20");
  await expect(shown).toHaveText("20");

  await range.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  const moved = await range.inputValue();
  expect(
    moved,
    "the arrow keys did not move the thumb, so this test cannot see the bug",
  ).not.toBe("20");
  await expect(
    shown,
    `the thumb moved to ${moved} and the reading beside it did not follow`,
  ).toHaveText(moved);
});

/**
 * And the second slider in the catalogue agrees with itself too.
 *
 * A different story, because the first test reads the first slider in a
 * matrix and a fix that happened to work for one instance is not a fix.
 * The name this test carried at first said "a controlled slider does not
 * move on its own", which is not what it does — the story is
 * uncontrolled. A test whose name describes a different test is a test
 * nobody will read correctly later.
 */
test("a second slider's reading agrees with its own thumb", async ({
  page,
}) => {
  await openStory(page, "components-slider--reorder-buffer");

  const range = page.locator("input[type=range]").first();
  const before = await range.inputValue();
  await range.focus();
  await page.keyboard.press("ArrowRight");

  const after = await range.inputValue();
  expect(after, "the arrow key did not move this thumb").not.toBe(before);

  const shown = await page.locator(".uix-field-aside").first().textContent();
  expect(
    shown?.trim(),
    `the thumb moved ${before} -> ${after} and the reading says ${shown}`,
  ).toBe(after);
});
