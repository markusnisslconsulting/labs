import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

/**
 * Screenshot every story so a human can look at all of them.
 *
 * Why this exists, and why it is not the Chromatic suite or the visual
 * baseline suite: both of those compare a render against a previous
 * render. Neither of them can tell you the previous render was already
 * wrong. Six defects shipped past a green pipeline — an Alert whose
 * dismiss button sat against the text instead of the far edge, a Select
 * that did not fill its row, Accordion stories that were the same story
 * three times — because every gate asserted a property of the DOM and no
 * gate ever produced a picture anybody read.
 *
 * So this target renders each story, writes a PNG, and stops. There is no
 * assertion beyond "it rendered something". Its output is contact sheets,
 * grouped per component, meant for eyes.
 */

const index = JSON.parse(
  readFileSync("dist/packages/ui-storybook/index.json", "utf8"),
) as {
  entries: Record<
    string,
    {
      id: string;
      type: string;
      title: string;
      name: string;
      tags?: string[];
    }
  >;
};

/* Only what a person browses. 81 of the 176 stories are interaction
   tests carrying `!dev`; they render the resting state again after their
   assertion, so sweeping them fills the contact sheets with duplicates of
   the examples and buries the thing you are looking for. */
const stories = Object.values(index.entries).filter(
  (e) => e.type === "story" && e.tags?.includes("dev"),
);

const OUT = process.env.SWEEP_OUT ?? "shots";
mkdirSync(OUT, { recursive: true });

for (const story of stories) {
  test(story.id, async ({ page }, testInfo) => {
    await page.goto(
      `http://127.0.0.1:4530/iframe.html?id=${story.id}&viewMode=story`,
    );
    const root = page.locator("#storybook-root");
    await expect(root).toBeVisible();
    // Fonts settle after first paint; a screenshot taken before they load
    // measures the fallback face, which is not the thing under review.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${OUT}/${testInfo.project.name}/${story.id}.png`,
      // The full page, not the element: a popover or a toast renders
      // outside the root, and those are exactly the ones that go wrong.
      fullPage: true,
    });
  });
}
