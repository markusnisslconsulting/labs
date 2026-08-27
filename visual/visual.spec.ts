import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Visual regression over a curated set of stories.
 *
 * Baselines live under visual/__screenshots__/<platform>/ and are produced
 * locally with `pnpm nx run ui:visual-update`. CI skips the test — font and
 * rendering differences between platforms make pixel comparison unreliable
 * without Chromatic — so the local run is the gate before a ui release.
 */

const server = process.env.VISUAL_SERVER ?? "http://127.0.0.1:4520";
const stories = [
  "components-button--matrix",
  "components-alert--info",
  "components-statuspill--all-tones",
  "foundations-brands--side-by-side",
] as const;

const baselineDir = path.resolve(
  import.meta.dirname,
  "__screenshots__",
  process.platform,
);

test.describe("visual regression", () => {
  test.describe.configure({ mode: "serial" });

  for (const story of stories) {
    test(`matches baseline: ${story}`, async ({ page }) => {
      const baseline = path.join(baselineDir, `${story}.png`);
      test.skip(
        process.env.CI === "true" && !existsSync(baseline),
        "no baseline for this platform",
      );

      await page.goto(`${server}/iframe.html?id=${story}&viewMode=story`, {
        waitUntil: "load",
      });
      await page.waitForTimeout(600);
      await expect(page.locator("#storybook-root").first()).toHaveScreenshot(
        `${story}.png`,
        { maxDiffPixelRatio: 0.02 },
      );
    });
  }
});
