import { expect, test } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";

/** Every page a visitor can reach without typing a URL by hand. */
const ROUTES = ["/", "/chat-box", "/on-device-ai", "/webmcp", "/workbench"];

for (const route of ROUTES) {
  test(`no serious accessibility violations on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await injectAxe(page);
    await checkA11y(
      page,
      undefined,
      { detailedReport: true, detailedReportOptions: { html: true } },
      false,
    );
  });
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
  const titles = page.locator(".lab-card-title a");
  const count = await titles.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    await titles.nth(index).focus();
    await expect(titles.nth(index)).toBeFocused();
  }
});
