import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { readManifest } from "./manifest";
test("catalog routes render the site and requested local assets load", async ({
  page,
}) => {
  for (const route of readManifest().routes) {
    await test.step(route, async () => {
      const failures: string[] = [];
      const responseListener = (
        response: import("@playwright/test").Response,
      ) => {
        if (
          response.url().startsWith(new URL(page.url()).origin) &&
          response.status() >= 400
        )
          failures.push(`${response.status()} ${response.url()}`);
      };
      page.on("response", responseListener);
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["cache-control"], route).toMatch(
        /(?:^|,)\s*(?:no-cache|no-store)(?:\s*(?:,|$))/,
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "This lab does not exist.",
          exact: true,
        }),
      ).toHaveCount(0);
      if (route === "/workbench") {
        await page
          .getByRole("button", { name: "Show embedded preview", exact: true })
          .click();
        const manager = page.frameLocator("iframe.story-frame");
        await expect(
          manager.getByRole("link", { name: /Storybook|Labs UI/ }).first(),
        ).toBeVisible();
        const preview = manager.frameLocator(
          'iframe[title="storybook-preview-iframe"]',
        );
        await expect(
          preview.getByRole("heading", { level: 1, name: /Labs UI$/ }),
        ).toBeVisible();
      }
      await page.waitForLoadState("networkidle");
      expect(failures).toEqual([]);
      page.off("response", responseListener);
    });
  }
});

test("Storybook navigation and example destinations stay inside the mounted workbench", async ({
  page,
}) => {
  await page.goto(
    "/storybook/iframe.html?id=components-breadcrumb--deep-trail&viewMode=story",
  );
  await page.getByRole("link", { name: "Design system", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Design system",
  );
  expect(new URL(page.url()).pathname).toBe(
    `/releases/${readManifest().releaseId}/storybook/iframe.html`,
  );
  await page
    .getByRole("link", { name: "Back to the component example", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Design system", exact: true }),
  ).toBeVisible();
});

test("manager navigation keeps stable URLs while all runtime files belong to its release", async ({
  page,
}) => {
  const requests: string[] = [];
  const failures: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (/\.(?:js|css|json|woff2)$/.test(path) || path.endsWith("/iframe.html"))
      requests.push(path);
  });
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/storybook/?path=/story/components-button--solid-accent");
  const preview = page.frameLocator("#storybook-preview-iframe");
  await expect(preview.locator(".uix-button").first()).toBeVisible();
  await page.getByRole("link", { name: "Outline", exact: true }).click();
  await expect(page).toHaveURL(
    /\/storybook\/\?path=\/story\/components-button--outline$/,
  );
  await expect(preview.locator(".uix-button").first()).toBeVisible();
  const skip = page.getByRole("link", { name: "Skip to sidebar", exact: true });
  const destination = await skip.evaluate(
    (link: HTMLAnchorElement) => link.href,
  );
  expect(new URL(destination).pathname).toBe("/storybook/");
  await skip.focus();
  await page.keyboard.press("Enter");
  expect(new URL(page.url()).pathname).toBe("/storybook/");
  await page.getByRole("link", { name: "Docs", exact: true }).click();
  await expect(
    preview.getByRole("heading", { name: "Button", exact: true }).first(),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(failures).toEqual([]);
  expect(requests.length).toBeGreaterThan(10);
  for (const path of requests)
    expect(path).toMatch(
      new RegExp(`^/releases/${readManifest().releaseId}/storybook/`),
    );
});

test("all artifact JavaScript and CSS files return their actual content types", async ({
  request,
}) => {
  const manifest = readManifest();
  const assets = Object.keys(manifest.files).filter((path) =>
    /\.(?:js|mjs|css)$/.test(path),
  );
  expect(assets.length).toBeGreaterThan(0);
  for (const path of assets) {
    const response = await request.get(`/${path}`);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(
      path.endsWith(".css") ? "text/css" : "javascript",
    );
    const body = await response.body();
    expect(body.length, path).toBe(manifest.files[path]!.bytes);
    expect(createHash("sha256").update(body).digest("hex"), path).toBe(
      manifest.files[path]!.sha256,
    );
  }
});

test("missing documents and assets are genuine 404 responses", async ({
  page,
  request,
}) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", {
      name: "This lab does not exist.",
      exact: true,
    }),
  ).toBeVisible();
  for (const path of [
    "/.htaccess",
    "/.env",
    "/missing-chunk.js",
    "/assets/missing.css",
    "/storybook/assets/missing.js",
    "/storybook/no-such-document",
    "/storybook/project.json",
    "/storybook/preview-stats.json",
    "/releases",
    `/releases/${readManifest().releaseId}/missing-document`,
  ]) {
    const missing = await request.get(path);
    expect(missing.status(), path).toBe(404);
    expect(await missing.text(), path).not.toContain('<div id="root">');
  }
});
