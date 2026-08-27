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
  /* Added after the value in a `base-select` field rendered 7px above the
     middle of its own box while every box on the row measured centred. No
     DOM assertion could see it: the element Chrome exposes for the rendered
     value is a full-size wrapper whose centre is the box's centre whatever
     the text does. Pixels were the only instrument that worked, and this is
     where this repository keeps pixels. */
  "components-select--matrix",
  /* `foundations-brands--side-by-side` used to be here. It was deleted when
     the brand comparison came out of the foundations pages, and this list
     kept naming it, so every run since has failed on "element is not
     visible" — `ui:visual-test` is not in `pnpm gates` (its baselines are
     per-platform and CI has none), so nothing said so. The replacement is
     the focus ring, which is a real cross-brand surface and does exist.
     `packages/ui/test/audit.spec.ts` now refuses a story id in this file
     that the built index does not have. */
  "foundations-focus--keyboard-ring",
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

  /**
   * One field, on its own, with no tolerance to hide in.
   *
   * The story-level baselines above compare a whole `#storybook-root` at
   * `maxDiffPixelRatio: 0.02`. On an 1100x800 shot that is roughly 17,600
   * pixels of licence, and a local defect is smaller than that: the value in
   * a `base-select` field rendered 7px above the middle of its box, across
   * five fields, and `components-select--matrix` still matched. Measured —
   * the misalignment was reproduced, the storybook rebuilt from scratch, and
   * the baseline passed.
   *
   * A tolerance that is right for font hinting across a whole page is wrong
   * for one control. So the field gets its own frame, where the same shift is
   * a large fraction of what is being compared.
   */
  test("matches baseline: a select field, on its own", async ({ page }) => {
    const baseline = path.join(baselineDir, "components-select--field.png");
    test.skip(
      process.env.CI === "true" && !existsSync(baseline),
      "no baseline for this platform",
    );

    await page.goto(
      `${server}/iframe.html?id=components-select--matrix&viewMode=story`,
      { waitUntil: "load" },
    );
    await page.waitForTimeout(600);
    await expect(page.locator(".uix-field-row").first()).toHaveScreenshot(
      "components-select--field.png",
      {
        maxDiffPixelRatio: 0.002,
      },
    );
  });
});
