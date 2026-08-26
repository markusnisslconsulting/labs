/**
 * Every docs page must render.
 *
 * The test runner replays stories, so all 145 of them were green while
 * Components/Button's docs page had been dead for days with
 * "t.startsWith is not a function". Forty docs pages, none of them
 * loaded by anything.
 *
 * The cause was one un-backticked `<a href />` inside a TSDoc comment:
 * markdown parsed it as a real anchor, and Storybook's link renderer
 * calls href.startsWith, which a valueless attribute does not have. No
 * amount of story coverage would have found it, because the crash lives
 * in the prose, not the component.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

interface Entry {
  type: string;
  title: string;
  name: string;
}

const index = JSON.parse(
  readFileSync("dist/packages/ui-storybook/index.json", "utf8"),
) as { entries: Record<string, Entry> };

const docs = Object.entries(index.entries)
  .filter(([, entry]) => entry.type === "docs")
  .map(([id, entry]) => ({ id, title: entry.title }));

test("the built index actually contains docs pages", () => {
  // Without this, an index shape change would turn the suite below into
  // zero tests and report success.
  expect(docs.length).toBeGreaterThan(20);
});

for (const { id, title } of docs) {
  test(`${title} renders (${id})`, async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));

    // The iframe URL renders the docs page without the manager, so a
    // failure here is the page's own, not the shell's.
    await page.goto(`/iframe.html?id=${id}&viewMode=docs`, {
      waitUntil: "networkidle",
    });

    const body = (await page.locator("body").innerText()).slice(0, 4000);
    expect(
      failures,
      `${id} threw while rendering:\n${failures.join("\n")}`,
    ).toEqual([]);
    expect(
      body,
      `${id} rendered Storybook's failure page:\n${body.slice(0, 600)}`,
    ).not.toMatch(/failed to render properly|is not a function/i);
    // A page that renders nothing is also a failure, and a silent one.
    expect(body.trim().length, `${id} rendered an empty body`).toBeGreaterThan(
      40,
    );
  });
}
