import { expect, test } from "@playwright/test";
import { loadCatalog } from "../scripts/catalog";
import { loadWorkbench } from "../scripts/workbench";
import { storybookHref } from "../src/catalog/workbench";
import { directories } from "../src/catalog/directories";

const catalog = loadCatalog().entries;
const workbench = loadWorkbench();
const cards = ".lab-card-title a";

test("overview links to four distinct directories with active navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".directory-card-title a")).toHaveCount(4);
  for (const directory of directories) {
    await page.locator(`.directory-card-title a[href="/${directory}"]`).click();
    await expect(
      page.locator(`.directory-nav a[href="/${directory}"]`),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.locator(".site-shell iframe")).toHaveCount(0);
    await page.locator('.directory-nav a[href="/"]').click();
  }
});

for (const [directory, kind] of [
  ["demos", "demo"],
  ["patterns", "pattern"],
] as const) {
  test(`${directory} contains only its catalog kind and retains filtered return navigation`, async ({
    page,
  }) => {
    await page.goto(`/${directory}`);
    const entries = catalog.filter((entry) => entry.kind === kind);
    await expect(page.locator(cards)).toHaveCount(entries.length);
    expect(
      await page
        .locator(cards)
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
    ).toEqual(entries.map((entry) => `/${entry.slug}`));
    const slug = entries[0]!.slug;
    await page.getByRole("searchbox").fill(slug);
    await expect(page.locator(cards)).toHaveCount(1);
    const filtered = page.url();
    await page.reload();
    await expect(page.getByRole("searchbox")).toHaveValue(slug);
    await page.locator(cards).click();
    const back = page.getByRole("link", {
      name: "Back to the catalog",
      exact: true,
    });
    await expect(back).toHaveAttribute("href", `/${directory}?q=${slug}`);
    await page.goBack();
    await expect(page).toHaveURL(filtered);
    await expect(page.locator(cards)).toBeFocused();
    await page.goForward();
    await back.click();
    await expect(page).toHaveURL(filtered);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  });
}

test("component search and status filters survive refresh and clear with focus", async ({
  page,
}) => {
  await page.goto("/components");
  await expect(page.locator(cards)).toHaveCount(workbench.components.length);
  expect(
    await page
      .locator(cards)
      .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
  ).toEqual(workbench.components.map(storybookHref));
  const search = page.getByRole("searchbox", {
    name: "Search components",
    exact: true,
  });
  await search.fill("button");
  await page
    .getByRole("combobox", { name: "Component status", exact: true })
    .selectOption("beta");
  await page.reload();
  await expect(search).toHaveValue("button");
  await expect(page.getByRole("combobox")).toHaveValue("beta");
  await expect(page.locator(cards)).toHaveText(["SplitButton"]);
  await page.goto("/components?q=missing&status=stable&context=article");
  await page
    .getByRole("button", { name: "Clear the filters", exact: true })
    .click();
  await expect(page.locator(cards)).toHaveCount(workbench.components.length);
  await expect(search).toBeFocused();
  expect(new URL(page.url()).search).toBe("?context=article");
  await page.goto("/components?status=unknown");
  await expect(page.getByRole("combobox")).toHaveValue("");
  await expect(page.locator(cards)).toHaveCount(workbench.components.length);
});

test("direct references open full-size component Docs, examples and foundations", async ({
  page,
}) => {
  await page.goto("/components?q=Button&status=stable");
  await page.locator(cards).getByText("Button", { exact: true }).click();
  await expect(
    page
      .frameLocator("#storybook-preview-iframe")
      .getByRole("heading", { name: "Button", exact: true })
      .first(),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("searchbox")).toHaveValue("Button");
  await page
    .locator(".lab-card")
    .filter({ has: page.getByRole("heading", { name: "Button", exact: true }) })
    .getByRole("link", { name: "View example", exact: true })
    .click();
  await expect(
    page
      .frameLocator("#storybook-preview-iframe")
      .getByRole("heading", { name: "States", exact: true }),
  ).toBeVisible();
  await page.goto("/foundations");
  await expect(page.locator(cards)).toHaveCount(workbench.foundations.length);
  expect(
    await page
      .locator(cards)
      .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
  ).toEqual(workbench.foundations.map(storybookHref));
  await page.locator(cards).getByText("Focus", { exact: true }).click();
  await expect(
    page
      .frameLocator("#storybook-preview-iframe")
      .getByRole("button", { name: "First", exact: true }),
  ).toBeVisible();
});

test("FAQ keeps one answer open and supports keyboard navigation and closing", async ({
  page,
}) => {
  await page.goto("/faq");
  const region = page.getByRole("region", {
    name: "Before the workshop",
    exact: true,
  });
  const first = region.getByRole("button", {
    name: "What should I bring?",
    exact: true,
  });
  const second = region.getByRole("button", {
    name: "Do I need previous experience?",
    exact: true,
  });
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await second.click();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowUp");
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(second).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(region.locator('[aria-expanded="true"]')).toHaveCount(0);
});
