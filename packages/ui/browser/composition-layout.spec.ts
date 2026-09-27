import { expect, test } from "@playwright/test";
import { openStory } from "./ready";

for (const theme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    for (const story of [
      "components-appshell--matrix",
      "components-appshell--an-application-page",
      "components-stepper--matrix",
    ]) {
      test(`${story} fits ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await openStory(page, story, { globals: `theme:${theme}` });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          ),
        ).toBeLessThanOrEqual(1);

        if (story.includes("appshell")) {
          const nav = await page.getByRole("navigation").boundingBox();
          const main = await page.getByRole("main").boundingBox();
          expect(nav).not.toBeNull();
          expect(main).not.toBeNull();
          if (width <= 768) {
            expect(main!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
            expect(main!.width).toBeGreaterThanOrEqual(width - 1);
          } else {
            expect(main!.x).toBeGreaterThanOrEqual(nav!.x + nav!.width);
          }
          // A short fullscreen page must not gain scroll height from decorators.
          expect(
            await page.evaluate(() => document.documentElement.scrollHeight),
          ).toBeLessThanOrEqual(901);
        } else {
          // No label may be clipped or overlap the following step.
          for (const list of await page.locator(".uix-stepper-list").all()) {
            const steps = await list.locator(".uix-stepper-step").all();
            for (let i = 0; i < steps.length; i++) {
              const box = await steps[i]!.boundingBox();
              const text =
                await steps[i]!.locator(".uix-stepper-text").boundingBox();
              expect(text!.x + text!.width).toBeLessThanOrEqual(
                box!.x + box!.width + 1,
              );
              if (i > 0) {
                const previous = await steps[i - 1]!.boundingBox();
                expect(
                  box!.x >= previous!.x + previous!.width - 1 ||
                    box!.y >= previous!.y + previous!.height - 1,
                ).toBe(true);
              }
            }
          }
        }
      });
    }
  }
}

test("a shell responds to its host width inside a wide page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStory(page, "components-appshell--matrix");
  await page.locator(".uix-appshell").evaluate((shell) => {
    shell.style.inlineSize = "360px";
  });
  const nav = await page.getByRole("navigation").boundingBox();
  const main = await page.getByRole("main").boundingBox();
  expect(main!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
  expect(main!.width).toBe(360);
});

test("AppShell docs isolate page landmarks in their own preview", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-appshell--docs&viewMode=docs");
  const frame = page.frameLocator('iframe[title="Matrix"]').first();
  await expect(frame.getByRole("main")).toBeVisible();
  const iframe = page.locator('iframe[title="Matrix"]').first();
  await expect(iframe).toHaveCSS("height", "600px");
  await expect(
    frame.getByRole("heading", { name: "Suppliers", exact: true }),
  ).toBeVisible();
});

for (const story of [
  "components-menu--placements",
  "components-skeleton--card-placeholder",
  "components-stack--matrix",
]) {
  for (const theme of ["light", "dark"]) {
    test(`${story} stays inside a 320px preview in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 780 });
      await openStory(page, story, { globals: `theme:${theme}` });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
      if (story === "components-menu--placements") {
        for (const trigger of await page
          .locator("#storybook-root button[aria-haspopup=menu]")
          .all()) {
          await trigger.click();
          const menu = page.getByRole("menu");
          await expect(menu).toBeVisible();
          const box = await menu.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(320);
          await page.keyboard.press("Escape");
          await expect(menu).toHaveCount(0);
        }
      }
    });
  }
}
