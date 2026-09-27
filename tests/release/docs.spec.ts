import { expect, test } from "@playwright/test";
import { readWorkbenchFacts } from "@labs/tools/vite-workbench-facts";

const introduction =
  "/storybook/iframe.html?id=introduction--docs&viewMode=docs";

test("introduction reports current package measurements with their scope", async ({
  page,
}) => {
  const facts = readWorkbenchFacts(process.cwd());
  await page.goto(introduction);
  const docs = page.locator(".sbdocs-content");
  await expect(docs).toContainText(`${facts.componentCount} components`);
  await expect(docs).toContainText(`@layer ${facts.layers.join(", ")};`);
  await expect(docs).toContainText("exclude external dependencies");
  await expect(docs).toContainText(/Measured \d{4}-\d{2}-\d{2} \(UTC\)/);
  await expect(
    page.getByRole("row", {
      name: new RegExp(`Largest component: ${facts.largest.name}`),
    }),
  ).toContainText(`${(facts.largest.total / 1024).toFixed(2)} KiB`);
  await expect(
    page.getByRole("row", { name: /^Global stylesheet/ }),
  ).toContainText(`${(facts.globalStyles / 1024).toFixed(2)} KiB`);
  await expect(
    page.getByRole("row", { name: /^Median component/ }),
  ).toContainText(`${(facts.median / 1024).toFixed(2)} KiB`);
});

test("every generated introduction reference resolves through the assembled manager", async ({
  page,
  request,
}) => {
  const index = (await (await request.get("/storybook/index.json")).json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/storybook/index.html?path=/docs/introduction--docs");
  const frame = page.frameLocator("#storybook-preview-iframe");
  const links = frame
    .getByRole("navigation", { name: "Workbench references", exact: true })
    .getByRole("link");
  await expect(links.first()).toBeVisible();
  const destinations = await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href")!),
  );
  expect(destinations.length).toBeGreaterThan(5);
  for (const href of destinations) {
    const path = new URL(href, "https://labs.invalid").searchParams.get(
      "path",
    )!;
    const [, type, id] = path.split("/");
    expect(index.entries[id!]?.type).toBe(type);
    await frame
      .locator(`nav[aria-label="Workbench references"] a[href="${href}"]`)
      .click();
    await expect(page).toHaveURL(new RegExp(`path=/${type}/${id}`));
    if (type === "docs")
      await expect(frame.locator(".sbdocs-content")).toBeVisible();
    else
      await expect(frame.locator("#storybook-root > *").first()).toBeVisible();
    await expect(frame.locator(".sb-errordisplay")).not.toBeVisible();
    await page.goto("/storybook/index.html?path=/docs/introduction--docs");
    await expect(links.first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("introduction keeps its instructions usable if the reference index request fails", async ({
  page,
}) => {
  let reads = 0;
  await page.route("**/index.json", (route) =>
    ++reads === 1 ? route.continue() : route.abort(),
  );
  await page.goto(introduction);
  await expect(page.locator(".sbdocs-content")).toContainText(
    "Reference links could not be loaded",
  );
  await expect(
    page.getByRole("heading", { name: /Use a component$/, level: 2 }),
  ).toBeVisible();
});

for (const id of [
  "introduction--docs",
  "guides-accessibility--docs",
  "guides-keyboard--docs",
]) {
  for (const theme of ["light", "dark"]) {
    test(`${id} stays within a 320px Docs canvas in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(
        `/storybook/iframe.html?id=${id}&viewMode=docs&globals=theme:${theme}`,
      );
      await expect(page.locator(".sbdocs-content")).toBeVisible();
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
      if (id === "guides-keyboard--docs") {
        const table = page.locator(".uix-table-wrap").first();
        await expect(table).toHaveAttribute("tabindex", "0");
        await table.focus();
        await expect(table).toBeFocused();
      }
    });
  }
}
