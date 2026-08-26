/**
 * A translation reaches the components.
 *
 * Seven strings were compiled in, all of them read aloud by a screen
 * reader, and no product serving a second market could change any of
 * them. The static gate now refuses a literal; this one proves the
 * replacement actually arrives, because a strings table nothing reads is
 * the same as a hardcoded string with extra steps.
 */
import { test, expect } from "@playwright/test";

test("the pagination labels come from the strings table", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-pagination--nine-pages&viewMode=story",
    { waitUntil: "networkidle" },
  );
  // The English defaults, which is what a consumer gets for free.
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Pagination" }),
  ).toBeVisible();
  // And the interpolated one, which is a function rather than a template
  // because word order is not universal.
  await expect(page.getByRole("button", { name: "Page 4" })).toBeVisible();
});

test("a locale replaces them without touching the component", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-pagination--localized&viewMode=story",
    {
      waitUntil: "networkidle",
    },
  );
  await expect(
    page.getByRole("navigation", { name: "Seitennummerierung" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Vorherige Seite" }),
  ).toBeVisible();
  // The number moved: German puts it after the word, same as English, but
  // the point is that the *function* decided, not a template we wrote.
  await expect(page.getByRole("button", { name: "Seite 4" })).toBeVisible();
});
