import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Visual regression über kuratierte Stories.
 *
 * Baselines unter visual/__screenshots__/<platform>/, erzeugt lokal
 * mit `pnpm nx run ui:visual-update`. CI überspringt den Test
 * (Font-/Rendering-Unterschiede zwischen Plattformen machen
 * Pixelvergleiche ohne Chromatic unzuverlässig); der lokale Lauf ist
 * der Gate vor jedem ui-Release.
 */

const server = process.env.VISUAL_SERVER ?? "http://127.0.0.1:4520";
const stories = [
  "components-button--matrix",
  "components-alert--info",
  "components-statuspill--all-tones",
  "foundations-tokens-primitive--primitive-tokens-story",
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
        "keine Baseline für diese Plattform",
      );

      await page.goto(`${server}/iframe.html?id=${story}&viewMode=story`, {
        waitUntil: "load",
      });
      await page.waitForTimeout(600);
      await expect(page.locator("#root").first()).toHaveScreenshot(
        `${story}.png`,
        { maxDiffPixelRatio: 0.02 },
      );
    });
  }
});
