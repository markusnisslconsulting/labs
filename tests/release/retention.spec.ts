import { once } from "node:events";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { assemble, verifyRelease } from "@labs/release-tools/assemble";
import { staticHandler } from "@labs/release-tools/http";
import { routeDocuments } from "@labs/release-tools/manifest";

test("retained assets keep open site and manager tabs usable after entry replacement and rollback", async ({
  browser,
}) => {
  const workspace = fileURLToPath(new URL("../..", import.meta.url));
  const root = await mkdtemp(join(tmpdir(), "labs-retention-"));
  const live = join(root, "public");
  const previous = join(workspace, "dist/release");
  const next = join(root, "next");
  const oldManifest = await verifyRelease(previous);
  const nextManifest = await assemble({
    site: join(workspace, "apps/site/dist"),
    storybook: join(workspace, "dist/packages/ui-storybook"),
    output: next,
    sourceSha:
      oldManifest.sourceSha === "b".repeat(40)
        ? "c".repeat(40)
        : "b".repeat(40),
    dirty: true,
  });
  await cp(join(previous, "public"), live, { recursive: true });
  let handler = staticHandler(
    live,
    routeDocuments(oldManifest.routes, oldManifest.releaseId),
  );
  const server = createServer((request, response) => {
    void handler(request, response);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing preview address");
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext();
  const failures: string[] = [];
  const requests: string[] = [];
  context.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  context.on("request", (request) =>
    requests.push(new URL(request.url()).pathname),
  );
  try {
    const site = await context.newPage();
    const manager = await context.newPage();
    await site.goto(origin);
    await expect(site.getByRole("heading", { level: 1 })).toBeVisible();
    await manager.goto(
      `${origin}/storybook/?path=/story/components-button--solid-accent`,
    );
    await expect(
      manager
        .frameLocator("#storybook-preview-iframe")
        .locator(".uix-button")
        .first(),
    ).toBeVisible();
    requests.length = 0;

    // Upload the new immutable directory before replacing stable entry files.
    await cp(join(next, "public/releases"), join(live, "releases"), {
      recursive: true,
    });
    await cp(join(next, "public"), live, {
      recursive: true,
      filter: (source) => source !== join(next, "public/releases"),
    });
    handler = staticHandler(
      live,
      routeDocuments(nextManifest.routes, nextManifest.releaseId),
    );

    await site.locator('a[href="/webmcp"]').first().click();
    await expect(site.getByRole("heading", { level: 1 })).toHaveText(
      "WebMCP: When a Page Declares Its Actions",
    );
    await manager.getByRole("link", { name: "Docs", exact: true }).click();
    await expect(
      manager
        .frameLocator("#storybook-preview-iframe")
        .getByRole("heading", { name: "Button", exact: true })
        .first(),
    ).toBeVisible();
    await manager
      .frameLocator("#storybook-preview-iframe")
      .locator("body")
      .evaluate(() => location.reload());
    await expect(
      manager
        .frameLocator("#storybook-preview-iframe")
        .getByRole("heading", { name: "Button", exact: true })
        .first(),
    ).toBeVisible();
    expect(
      requests.some((path) =>
        path.startsWith(`/releases/${oldManifest.releaseId}/assets/`),
      ),
    ).toBe(true);
    expect(
      requests.some((path) =>
        path.startsWith(`/releases/${oldManifest.releaseId}/storybook/`),
      ),
    ).toBe(true);
    expect(
      requests.some((path) =>
        path.startsWith(`/releases/${nextManifest.releaseId}/`),
      ),
    ).toBe(false);

    const current = await context.newPage();
    const currentSite = await context.newPage();
    const promoted = await currentSite.goto(`${origin}/webmcp`);
    expect(await promoted!.text()).toContain(
      `/releases/${nextManifest.releaseId}/assets/`,
    );
    await expect(
      currentSite.getByRole("button", { name: "Save", exact: true }),
    ).toBeVisible();
    await current.goto(
      `${origin}/storybook/?path=/story/components-button--solid-accent`,
    );
    await expect(
      current
        .frameLocator("#storybook-preview-iframe")
        .locator(".uix-button")
        .first(),
    ).toBeVisible();
    expect(
      current
        .frames()
        .some((frame) =>
          frame
            .url()
            .includes(
              `/releases/${nextManifest.releaseId}/storybook/iframe.html`,
            ),
        ),
    ).toBe(true);

    // Roll back entry files without deleting either release's assets.
    await cp(join(previous, "public"), live, {
      recursive: true,
      filter: (source) => source !== join(previous, "public/releases"),
    });
    handler = staticHandler(
      live,
      routeDocuments(oldManifest.routes, oldManifest.releaseId),
    );
    const restored = await currentSite.reload();
    expect(await restored!.text()).toContain(
      `/releases/${oldManifest.releaseId}/assets/`,
    );
    await currentSite
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await expect(currentSite.getByTestId("reorder-point")).toHaveText(
      "1,240 units",
    );
    await current.reload();
    await expect(
      current
        .frameLocator("#storybook-preview-iframe")
        .locator(".uix-button")
        .first(),
    ).toBeVisible();
    expect(
      current
        .frames()
        .some((frame) =>
          frame
            .url()
            .includes(
              `/releases/${oldManifest.releaseId}/storybook/iframe.html`,
            ),
        ),
    ).toBe(true);
    expect(
      await readFile(
        join(
          live,
          `releases/${oldManifest.releaseId}/storybook/sb-manager/globals-runtime.js`,
        ),
      ),
    ).toEqual(
      await readFile(
        join(
          previous,
          `public/releases/${oldManifest.releaseId}/storybook/sb-manager/globals-runtime.js`,
        ),
      ),
    );
    expect(failures).toEqual([]);
  } finally {
    await context.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
});
