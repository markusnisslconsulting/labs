import { expect, test } from "@playwright/test";
import { examplePages, type ExamplePage } from "../.storybook/examplePages";
import { openStory } from "./ready";

for (const story of [
  "components-breadcrumb--trail",
  "components-breadcrumb--deep-trail",
  "components-breadcrumb--composed-trail",
  "components-pageheader--matrix",
  "components-pageheader--a-detail-page",
  "components-button--as-link",
  "components-badge--as-link",
  "components-fileupload--rows-rendered-by-the-caller",
]) {
  test(`${story} links reach a local example and return`, async ({ page }) => {
    await openStory(page, story);
    const links = page.locator("#storybook-root a[href]");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index++) {
      await openStory(page, story);
      const link = page.locator("#storybook-root a[href]").nth(index);
      const href = await link.getAttribute("href");
      expect(href).toContain("id=examples-destinations--preview");
      const key = new URL(href!, page.url()).searchParams
        .get("args")
        ?.split(";")
        .find((arg) => arg.startsWith("page:"))
        ?.slice(5);
      if (!key || !(key in examplePages))
        throw new Error("Missing example destination");
      await link.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        examplePages[key as ExamplePage].title,
      );
      await expect(page.getByText(/This lab does not exist/)).toHaveCount(0);
      await page
        .getByRole("link", {
          name: "Back to the component example",
          exact: true,
        })
        .click();
      await expect(
        page.locator("#storybook-root a[href]").first(),
      ).toBeVisible();
    }
  });
}

test("a breadcrumb destination works with keyboard activation", async ({
  page,
}) => {
  await openStory(page, "components-breadcrumb--deep-trail");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Labs", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Labs overview", exact: true }),
  ).toBeVisible();
});
