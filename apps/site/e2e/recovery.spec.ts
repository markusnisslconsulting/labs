import { expect, test, type Page } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";

const demoModule = /\/assets\/LabDemo-[^/]+\.js$/;
const diagnostic = "synthetic private diagnostic";

async function failRender(page: Page) {
  await page.addInitScript(() => {
    Reflect.set(window, "recoveryFixtureFails", true);
  });
  await page.route(demoModule, (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export default function Demo() {
        if (Reflect.get(window, "recoveryFixtureFails"))
          throw new Error(${JSON.stringify(diagnostic)});
        return "Recovered fixture";
      }`,
    }),
  );
}

async function failPage(page: Page) {
  await page.addInitScript(() => {
    Reflect.set(
      window,
      "recoveryFixtureFails",
      sessionStorage.getItem("allowRecovery") !== "true",
    );
    const get = URLSearchParams.prototype.get;
    URLSearchParams.prototype.get = function (name) {
      if (name === "q" && Reflect.get(window, "recoveryFixtureFails"))
        throw new Error("synthetic private diagnostic");
      return get.call(this, name);
    };
  });
}

async function expectShell(page: Page) {
  await expect(
    page.getByRole("navigation", { name: "Primary", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(diagnostic);
}

test("a failed module leaves lab details usable and reloads into a working demo", async ({
  page,
}) => {
  await page.route(demoModule, (route) => route.abort("failed"));
  await page.goto("/webmcp");
  const demo = page.getByRole("region", {
    name: "Interactive demo",
    exact: true,
  });
  await expect(demo.getByRole("alert")).toContainText(
    "The demo could not load.",
  );
  const reload = demo.getByRole("button", { name: "Reload page", exact: true });
  await expect(reload).toBeFocused();
  await expectShell(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Requirements", exact: true }),
  ).toBeVisible();
  await page.unroute(demoModule);
  await reload.click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("reorder-point")).toHaveText("1,240 units");
  await expect(demo.getByRole("alert")).toHaveCount(0);
});

test("repeated load failures require an explicit reload and preserve catalog filters", async ({
  page,
}) => {
  let documents = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documents++;
  });
  await page.route(demoModule, (route) => route.abort("failed"));
  await page.goto("/?q=webmcp&tag=agents");
  await page.locator(".lab-card-title a").click();
  const demo = page.getByRole("region", {
    name: "Interactive demo",
    exact: true,
  });
  await expect(demo.getByRole("alert")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(documents).toBe(1);
  await demo.getByRole("button", { name: "Reload page", exact: true }).click();
  await expect(demo.getByRole("alert")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(documents).toBe(2);
  await demo
    .getByRole("link", { name: "Back to the catalog", exact: true })
    .click();
  await expect(page).toHaveURL(/\/\?q=webmcp&tag=agents$/);
  await expect(
    page.getByRole("searchbox", { name: "Search the labs", exact: true }),
  ).toHaveValue("webmcp");
  expect(documents).toBe(2);
});

test("a rendering failure restarts in place and returns focus to the demo", async ({
  page,
}) => {
  await failRender(page);
  await page.goto("/webmcp");
  const restart = page.getByRole("button", {
    name: "Restart demo",
    exact: true,
  });
  await expect(restart).toBeFocused();
  await expectShell(page);
  await page.evaluate(() => Reflect.set(window, "recoveryFixtureFails", false));
  await restart.click();
  const demo = page.getByRole("region", {
    name: "Interactive demo",
    exact: true,
  });
  await expect(demo).toContainText("Recovered fixture");
  await expect(demo).toBeFocused();
  await expect(demo.getByRole("alert")).toHaveCount(0);
});

test("a page failure can retry and focus the restored main content", async ({
  page,
}) => {
  await failPage(page);
  await page.goto("/");
  const retry = page.getByRole("button", { name: "Try again", exact: true });
  await expect(retry).toBeFocused();
  await expectShell(page);
  await page.evaluate(() => Reflect.set(window, "recoveryFixtureFails", false));
  await retry.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Demos and UI workbench",
  );
  await expect(page.getByRole("main")).toBeFocused();
});

test("navigation to a different page clears a page failure", async ({
  page,
}) => {
  await failPage(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: "Storybook", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workbench$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("the page fallback returns to the catalog with a fresh document", async ({
  page,
}) => {
  await failPage(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("allowRecovery", "true"));
  await page
    .getByRole("link", { name: "Back to the catalog", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Demos and UI workbench",
  );
});

for (const kind of ["load", "render", "page"] as const) {
  for (const theme of ["light", "dark"]) {
    for (const width of [320, 1280]) {
      test(`${kind} failure is accessible and contained at ${width}px in ${theme}`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        if (kind === "load")
          await page.route(demoModule, (route) => route.abort("failed"));
        else if (kind === "render") await failRender(page);
        else await failPage(page);
        await page.goto(kind === "page" ? "/" : "/webmcp");
        await expect(page.getByRole("alert")).toBeVisible();
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        await page.evaluate(() => document.fonts.ready);
        await expectShell(page);
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
        await injectAxe(page);
        await checkA11y(page, undefined, { detailedReport: true }, false);
        if (width === 320)
          await page.screenshot({
            path: testInfo.outputPath("recovery.png"),
            fullPage: true,
          });
      });
    }
  }
}
