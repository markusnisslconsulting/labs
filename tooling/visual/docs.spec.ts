import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Docs pages, screenshotted.
 *
 * The story sweep renders `iframe.html`, which is the canvas alone. The
 * docs page is a different document — Storybook's own chrome plus the
 * library's stylesheet in one place — and it had its own defect: our
 * focus ring reached the "Show code" button and drew a second border
 * around one that already had its own. Nothing in the pipeline looked at
 * a docs page at all.
 */
const OUT = process.env.SWEEP_OUT ?? "shots";
const PAGES = [
  "components-button--docs",
  "components-field--docs",
  "components-select--docs",
  "foundations-tokens--docs",
  "guides-theming--docs",
];

for (const id of PAGES) {
  test(id, async ({ page }, testInfo) => {
    mkdirSync(`${OUT}/${testInfo.project.name}`, { recursive: true });
    await page.goto(`http://127.0.0.1:4530/?path=/docs/${id}`);
    const frame = page.frameLocator("#storybook-preview-iframe");
    await frame.locator(".sbdocs-content").first().waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    // Focus a "Show code" toggle, which is what the report was about.
    const toggle = frame.getByRole("button", { name: /Show code/i }).first();
    if (await toggle.count()) {
      await toggle.scrollIntoViewIfNeeded();
      await toggle.focus();
      await page.waitForTimeout(300);
      // The toggle's own row, not the viewport: the docs page scrolls
      // inside the preview iframe, so a page screenshot shows the top of
      // the document however far the toggle has been scrolled.
      await toggle.screenshot({
        path: `${OUT}/${testInfo.project.name}/toggle-${id}.png`,
      });
    }
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${OUT}/${testInfo.project.name}/docs-${id}.png`,
      fullPage: false,
    });
  });
}
