import { expect, test } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";

import { loadCatalog } from "../scripts/catalog";
import { localize } from "../src/catalog/localize";
import { publicRoutes } from "../src/catalog/directories";

const { entries } = loadCatalog();
const ROUTES = publicRoutes(entries);

for (const theme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    for (const route of [...ROUTES, "/not-a-lab"]) {
      test(`${route} is accessible and contained at ${width}px in ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "networkidle" });
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        await page.evaluate(() => document.fonts.ready);
        const dimensions = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
          mainWidth: document.querySelector("main")!.clientWidth,
          mainContent: document.querySelector("main")!.scrollWidth,
        }));
        expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
        expect(dimensions.mainContent).toBeLessThanOrEqual(
          dimensions.mainWidth + 1,
        );
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await injectAxe(page);
        await checkA11y(
          page,
          undefined,
          { detailedReport: true, detailedReportOptions: { html: true } },
          false,
        );
      });
    }
  }
}

test("the tag filter reports its state to assistive technology", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const all = page.getByRole("button", { name: "All", exact: true });
  await expect(all).toHaveAttribute("aria-pressed", "true");

  const agents = page.getByRole("button", { name: "agents", exact: true });
  await agents.click();
  await expect(agents).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveAttribute("aria-pressed", "false");
});

test("every lab card is reachable from the keyboard", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const expected = entries.map((entry) => `/${entry.slug}`).sort();
  const seen = new Set<string>();
  const stops = await page
    .locator("a[href], button, input, select, textarea, [tabindex]")
    .count();
  for (let index = 0; index <= stops && seen.size < expected.length; index++) {
    await page.keyboard.press("Tab");
    const href = await page
      .locator(".lab-card-title a")
      .evaluateAll((links) =>
        links
          .find((link) => link === document.activeElement)
          ?.getAttribute("href"),
      );
    if (href) seen.add(href);
  }
  expect([...seen].sort()).toEqual(expected);
});

for (const entry of entries) {
  test(`${entry.slug} renders its catalog identity and resources`, async ({
    page,
  }) => {
    await page.goto(`/${entry.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      localize(entry.title),
    );
    for (const resource of entry.resources) {
      await expect(
        page.locator(".link-row").getByRole("link", {
          name: `${localize(resource.title)} ↗`,
          exact: true,
        }),
      ).toHaveAttribute("href", resource.href);
    }
    for (const requirement of entry.requirements) {
      await expect(
        page.getByText(localize(requirement.detail), { exact: false }),
      ).toBeVisible();
    }
  });
}
