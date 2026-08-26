/**
 * The print sheet has to out-rank the components, and only its layer
 * position makes that true.
 *
 * These rules undo what a component declares — a card's fill, a toast's
 * position — and a component sits in `@layer components`. In `base` they
 * would lose to every component; in `overrides` they would take a
 * product's own print rules with them. Hence
 * `tokens, base, components, print, overrides`, which is asserted in the
 * source and prepended to every emitted stylesheet, and measured here in
 * the only way that counts: with print media in force.
 */
import { test, expect, type Page } from "@playwright/test";

async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`, {
    waitUntil: "networkidle",
  });
}

/** The same element, measured on screen and then on paper. */
async function screenThenPrint(
  page: Page,
  selector: string,
  read: (el: Element) => string,
) {
  await page.emulateMedia({ media: "screen" });
  const screen = await page.locator(selector).first().evaluate(read);
  await page.emulateMedia({ media: "print" });
  const print = await page.locator(selector).first().evaluate(read);
  await page.emulateMedia({ media: "screen" });
  return { screen, print };
}

test("a card drops its fill and its shadow on paper", async ({ page }) => {
  await story(page, "components-card--with-slots");
  const background = await screenThenPrint(
    page,
    ".uix-card",
    (el) => getComputedStyle(el).backgroundColor,
  );
  const shadow = await screenThenPrint(
    page,
    ".uix-card",
    (el) => getComputedStyle(el).boxShadow,
  );

  expect(
    background.print,
    "the card still prints a filled surface; the print layer is not out-ranking @layer components",
  ).not.toBe(background.screen);
  expect(background.print).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  expect(shadow.print, "the card still prints a shadow").toBe("none");
});

test("a card keeps an edge once the fill is gone", async ({ page }) => {
  await story(page, "components-card--with-slots");
  await page.emulateMedia({ media: "print" });
  const width = await page
    .locator(".uix-card")
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth) || 0);
  await page.emulateMedia({ media: "screen" });
  expect(
    width,
    "with no fill and no shadow the card has nothing left to show its bounds",
  ).toBeGreaterThan(0);
});

test("a table repeats its header across pages", async ({ page }) => {
  await story(page, "components-table--wide-columns");
  const display = await screenThenPrint(
    page,
    "thead",
    (el) => getComputedStyle(el).display,
  );
  expect(
    display.print,
    "thead does not become a table-header-group, so a long table loses its header after page one",
  ).toBe("table-header-group");
});

test("a row is not split across a page break", async ({ page }) => {
  await story(page, "components-table--wide-columns");
  await page.emulateMedia({ media: "print" });
  const value = await page
    .locator("tbody tr")
    .first()
    .evaluate((el) => getComputedStyle(el).breakInside);
  await page.emulateMedia({ media: "screen" });
  expect(value).toBe("avoid");
});

test("nothing that cannot be operated is printed", async ({ page }) => {
  await story(page, "components-toaster--stack");
  const display = await screenThenPrint(
    page,
    ".uix-toaster",
    (el) => getComputedStyle(el).display,
  );
  expect(display.screen).not.toBe("none");
  expect(
    display.print,
    "the toast stack prints over the content it was floating above",
  ).toBe("none");
});
