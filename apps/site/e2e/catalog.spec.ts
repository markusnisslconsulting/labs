import { expect, test } from "@playwright/test";
import { loadCatalog } from "../scripts/catalog";

const { entries } = loadCatalog();

const cards = ".lab-card-title a";

test("filters survive refresh, detail navigation, return links and browser history", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", {
    name: "Search the labs",
    exact: true,
  });
  await search.fill("web");
  await expect(search).toBeFocused();
  await page.getByRole("button", { name: "agents", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Execution mode", exact: true })
    .selectOption("native");
  await expect(page.locator(cards)).toHaveCount(1);
  const filtered = page.url();
  expect(new URL(filtered).searchParams.get("q")).toBe("web");
  expect(new URL(filtered).searchParams.get("tag")).toBe("agents");
  await page.reload();
  await expect(search).toHaveValue("web");
  await expect(
    page.getByRole("combobox", { name: "Execution mode", exact: true }),
  ).toHaveValue("native");
  await expect(
    page.getByRole("button", { name: "agents", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(cards).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Back to the catalog", exact: true }),
  ).toHaveAttribute(
    "href",
    new URL(filtered).pathname + new URL(filtered).search,
  );
  await page.goBack();
  await expect(page).toHaveURL(filtered);
  await expect(page.locator(cards)).toBeFocused();
  await page.goForward();
  await page
    .getByRole("link", { name: "Back to the catalog", exact: true })
    .click();
  await expect(page).toHaveURL(filtered);
  await expect(page.locator(cards)).toHaveCount(1);
});

test("back restores the card and scroll position on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  const link = page.locator("#catalog-workbench");
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(300);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(link).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(before, 0);
});

test("empty results can be cleared without losing unrelated URL parameters", async ({
  page,
}) => {
  await page.goto(
    "/?q=missing-example&tag=absent&execution=native&context=article",
  );
  await expect(page.locator(cards)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Clear the filters", exact: true })
    .click();
  await expect(page.locator(cards)).toHaveCount(entries.length);
  await expect(
    page.getByRole("searchbox", { name: "Search the labs", exact: true }),
  ).toBeFocused();
  expect(new URL(page.url()).search).toBe("?context=article");
});

test("the skip link reaches main content and the footer identifies the site", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: "Markus Nissl Consulting", exact: true }),
  ).toHaveAttribute("href", "https://www.markusnissl.com/");
  await expect(
    footer.getByRole("link", { name: "Legal notice", exact: true }),
  ).toHaveAttribute("href", "https://www.markusnissl.com/legal-notice");
  await expect(
    footer.getByRole("link", { name: "Privacy policy", exact: true }),
  ).toHaveAttribute("href", "https://www.markusnissl.com/privacy-policy");
});

test("the workbench opens directly and loads its embedded manager only on request", async ({
  page,
}) => {
  const storybookRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/storybook/"))
      storybookRequests.push(request.url());
  });
  await page.goto("/workbench", { waitUntil: "networkidle" });
  expect(storybookRequests).toEqual([]);
  await expect(page.locator("iframe.story-frame")).toHaveCount(0);
  const fullSize = page.getByRole("link", {
    name: "Open in Storybook",
    exact: true,
  });
  await expect(fullSize).toHaveAttribute(
    "href",
    "/storybook/index.html?path=/docs/introduction--docs",
  );
  await page
    .getByRole("button", { name: "Show embedded preview", exact: true })
    .click();
  await expect(page.locator("iframe.story-frame")).toBeVisible();
  await page
    .getByRole("button", { name: "Hide embedded preview", exact: true })
    .click();
  await expect(page.locator("iframe.story-frame")).toHaveCount(0);
  await fullSize.click();
  await expect(
    page
      .frameLocator('iframe[title="storybook-preview-iframe"]')
      .getByRole("heading", { level: 1, name: /Labs UI$/ }),
  ).toBeVisible();
});

test("consecutive filter events compose before a route transition renders", async ({
  page,
}) => {
  await page.goto("/?q=web");
  await page.evaluate(() => {
    const tag = [...document.querySelectorAll("button")].find(
      (button) => button.textContent === "agents",
    )!;
    const execution = document.querySelector<HTMLSelectElement>(
      'select[name="catalog-execution"]',
    )!;
    tag.click();
    execution.value = "native";
    execution.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator(cards)).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "agents", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const params = new URL(page.url()).searchParams;
  expect(params.get("q")).toBe("web");
  expect(params.get("tag")).toBe("agents");
  expect(params.get("execution")).toBe("native");
});
