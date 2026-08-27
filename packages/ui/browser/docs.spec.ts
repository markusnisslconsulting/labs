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
      waitUntil: "domcontentloaded",
    });

    /* Wait for the settled page, not for the network, and read it once.
     *
     * Two things were wrong here. It waited on `networkidle`, which is a
     * guess about rendering dressed as a wait: Storybook mounts an
     * autodocs page after its modules load, so the network can go quiet
     * before React has committed. In CI, on the two heaviest pages, it
     * had not — Button and Dialog reported an empty body while every
     * other page passed, and both had just gained a story.
     *
     * Then it read `body.innerText()` twice and asserted on both reads. A
     * docs page re-renders once after mount, so the second read landed in
     * the gap: the first said the page was there, the second said it was
     * empty, and which page it happened to be changed every run. The
     * assertion was measuring the sample time.
     *
     * So: poll until the page has content, keep that text, and assert on
     * it. A page that never renders fails with a timeout naming itself,
     * which is the same defect reported honestly.
     */
    let settled = "";
    await expect
      .poll(
        async () => {
          settled = (await page.locator("body").innerText()).trim();
          return settled.length;
        },
        { timeout: 30_000, message: `${id} never rendered a body` },
      )
      .toBeGreaterThan(40);

    const body = settled.slice(0, 4000);
    expect(
      failures,
      `${id} threw while rendering:\n${failures.join("\n")}`,
    ).toEqual([]);
    expect(
      body,
      `${id} rendered Storybook's failure page:\n${body.slice(0, 600)}`,
    ).not.toMatch(/failed to render properly|is not a function/i);
  });
}

test("docs chrome keeps its own focus ring", async ({ page }) => {
  await page.goto("/?path=/docs/components-button--docs");
  const frame = page.frameLocator("#storybook-preview-iframe");
  await frame
    .locator(".docblock-code-toggle")
    .first()
    .waitFor({ timeout: 20_000 });

  const measured = await page.frames()[1]!.evaluate(() => {
    const toggle = document.querySelector(
      ".docblock-code-toggle",
    ) as HTMLElement;
    toggle.focus();
    const chrome = getComputedStyle(toggle);
    const ours = document.querySelector(".uix-button") as HTMLElement;
    ours.focus();
    const library = getComputedStyle(ours);
    return {
      chrome: {
        width: chrome.outlineWidth,
        color: chrome.outlineColor,
        style: chrome.outlineStyle,
      },
      library: {
        width: library.outlineWidth,
        color: library.outlineColor,
        style: library.outlineStyle,
      },
    };
  });

  console.log(JSON.stringify(measured, null, 1));

  // Our own button wears the brand ring.
  // The library's own button in a docs page wears the brand ring, exactly
  // as it does in a story. It did not, because a rule meant to spare
  // Storybook's chrome was scoped to Storybook's scroll wrapper.
  expect(measured.library.width).toBe("2px");
  expect(measured.library.style).toBe("solid");
  // Storybook's does not.
  expect(measured.chrome.color).not.toBe(measured.library.color);
});
