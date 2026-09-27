import { expect, test, type Page } from "@playwright/test";
import { openStory } from "./ready";

async function staysWithinPage(page: Page) {
  const size = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
}

for (const theme of ["light", "dark"]) {
  test(`Docs examples and source remain readable in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(
      `/iframe.html?id=guides-accessibility--docs&viewMode=docs&globals=theme:${theme}`,
    );
    await page.waitForFunction(
      (theme) => document.documentElement.getAttribute("data-theme") === theme,
      theme,
    );
    await expect(
      page.getByRole("textbox", { name: "Contact name", exact: true }),
    ).toBeVisible();
    const source = page
      .locator("pre.prismjs")
      .filter({ hasText: "export function ContactForm" });
    await expect(source).toBeVisible();
    const colours = await page
      .locator(".sbdocs-preview .docs-story")
      .first()
      .evaluate((node) => ({
        example: getComputedStyle(node).backgroundColor,
        page: getComputedStyle(document.body).backgroundColor,
      }));
    expect(colours.example).toBe(colours.page);
    expect(colours.example).not.toBe("rgba(0, 0, 0, 0)");
    await staysWithinPage(page);
  });

  test(`guide preferences and form work in ${theme}`, async ({ page }) => {
    await openStory(page, "guides-examples--local-preferences", {
      globals: `theme:${theme}`,
    });
    const checkbox = page.getByRole("checkbox", {
      name: "Workshop reminders",
      exact: true,
    });
    await expect(checkbox).not.toBeChecked();
    await page.getByText("Workshop reminders", { exact: true }).click();
    await expect(checkbox).toBeChecked();
    await expect(page.getByRole("status")).toHaveText("Reminders are on.");
    await page
      .getByRole("button", { name: "Reset preference", exact: true })
      .click();
    await expect(checkbox).not.toBeChecked();

    await openStory(page, "guides-examples--accessible-form", {
      globals: `theme:${theme}`,
    });
    const field = page.getByRole("textbox", {
      name: "Contact name",
      exact: true,
    });
    await expect(field).toHaveAttribute("required", "");
    await page
      .getByRole("button", { name: "Save example", exact: true })
      .click();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    const errorLink = page.getByRole("link", {
      name: "Contact name",
      exact: true,
    });
    await expect(errorLink).toBeVisible();
    await errorLink.click();
    await expect(field).toBeFocused();
    await field.fill("Alex Example");
    await page
      .getByRole("button", { name: "Save example", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(
      "Request saved in this example.",
    );
    await expect(errorLink).toHaveCount(0);
  });

  for (const width of [320, 1280]) {
    test(`brand references fit ${width}px in ${theme}`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const reference of ["logo", "typography", "colour"]) {
        await openStory(page, `foundations-${reference}--reference`, {
          globals: `theme:${theme}`,
        });
        await staysWithinPage(page);
        if (reference === "logo") {
          const downloads = page.getByRole("link", {
            name: /^Download .* logo$/,
          });
          await expect(downloads).toHaveCount(4);
          for (const link of await downloads.all()) {
            const href = await link.getAttribute("href");
            const response = await request.get(new URL(href!, page.url()).href);
            expect(response.ok()).toBe(true);
            const bytes = await response.body();
            expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
            expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
          }
        }
        if (reference === "typography") {
          const title = page.getByRole("textbox", {
            name: "Workshop title",
            exact: true,
          });
          await title.fill("A saved title");
          await page
            .getByRole("button", { name: "Save title", exact: true })
            .click();
          await title.fill("An unsaved title");
          await page
            .getByRole("button", { name: "Cancel", exact: true })
            .click();
          await expect(title).toHaveValue("A saved title");
          expect(
            await page
              .locator(".brand-type-display")
              .evaluate((node) => getComputedStyle(node).fontFamily),
          ).toContain("Bricolage");
        }
      }
    });

    test(`workshop links, questions and form work at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openStory(page, "patterns-workshop--page", {
        globals: `theme:${theme}`,
      });
      await staysWithinPage(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const link of await page.locator('a[href^="#"]').all()) {
        const href = await link.getAttribute("href");
        expect(await page.locator(href!).count()).toBe(1);
      }
      await page
        .getByRole("link", { name: "Explore the topics", exact: true })
        .click();
      await expect(page).toHaveURL(/#topics$/);
      const question = page.getByRole("button", {
        name: "Can I book this workshop?",
        exact: true,
      });
      await question.focus();
      await page.keyboard.press("Enter");
      await expect(question).toHaveAttribute("aria-expanded", "true");
      await expect(
        page.getByText(
          "This is a fictional workshop. The form demonstrates validation and local state; it does not create a booking.",
        ),
      ).toBeVisible();
      await page
        .getByRole("textbox", { name: "Contact name", exact: true })
        .fill("Alex Example");
      await page
        .getByRole("button", { name: "Save example", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        "Request saved in this example.",
      );
      await page.evaluate(
        () => (document.documentElement.style.fontSize = "200%"),
      );
      await staysWithinPage(page);
    });
  }
}
