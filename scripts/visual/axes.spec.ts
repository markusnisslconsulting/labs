import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

/**
 * The state matrices, under every axis the toolbar offers.
 *
 * The story sweep renders 95 examples and every one of them is light
 * theme, left-to-right, default density, default brand. The dark theme,
 * RTL, the density scale and the coaching brand each have gates
 * asserting properties about them, and no picture anyone has looked at.
 *
 * Every defect found in this repository so far came from a configuration
 * nobody had seen. The preview file says as much about the dark theme in
 * its own comment: "Dark shipped for months with a black-on-dark select,
 * a tooltip trigger on the browser's grey button face, and a nested brand
 * that kept its light accent under a dark root."
 *
 * One story per component — the matrix, which is the frame each component
 * chose as showing all of its states — across six configurations. Small
 * enough to look at, wide enough to catch a hue that does not flip.
 */
const index = JSON.parse(
  readFileSync("dist/packages/ui-storybook/index.json", "utf8"),
) as {
  entries: Record<
    string,
    { id: string; type: string; title: string; name: string; tags?: string[] }
  >;
};

/** One frame per component: its matrix, or its single photographed story. */
const stories = Object.values(index.entries).filter(
  (entry) =>
    entry.type === "story" &&
    entry.tags?.includes("dev") &&
    /matrix|all tones|ordering desk|open with page behind|structured/i.test(
      entry.name,
    ),
);

const AXES = [
  { name: "01-base", globals: "" },
  { name: "02-dark", globals: "theme:dark" },
  { name: "03-rtl", globals: "direction:rtl" },
  { name: "04-coaching", globals: "brand:coaching" },
  { name: "05-coaching-dark", globals: "brand:coaching;theme:dark" },
  { name: "06-compact", globals: "density:compact" },
  { name: "07-comfortable", globals: "density:comfortable" },
];

const OUT = process.env.SWEEP_OUT ?? "axes";

for (const axis of AXES) {
  test.describe(axis.name, () => {
    for (const story of stories) {
      test(`${axis.name} ${story.id}`, async ({ page }, testInfo) => {
        const dir = `${OUT}/${testInfo.project.name}/${axis.name}`;
        mkdirSync(dir, { recursive: true });
        const globals = axis.globals ? `&globals=${axis.globals}` : "";
        await page.goto(
          `http://127.0.0.1:4530/iframe.html?id=${story.id}&viewMode=story${globals}`,
        );
        const root = page.locator("#storybook-root");
        await expect(root).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `${dir}/${story.id}.png`,
          fullPage: true,
        });
      });
    }
  });
}
