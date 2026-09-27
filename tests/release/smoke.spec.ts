import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { readManifest } from "./manifest";

test("stable public entries and the schema match the tested artifact", async ({
  request,
}) => {
  const manifest = readManifest();
  for (const path of Object.keys(manifest.files).filter(
    (path) => !path.startsWith("releases/") && path !== ".htaccess",
  )) {
    const response = await request.get(
      `/${path}?release-check=${manifest.releaseId}`,
      { headers: { "Cache-Control": "no-cache" } },
    );
    expect(response.status(), path).toBe(200);
    if (path.endsWith(".html"))
      expect(response.headers()["cache-control"], path).toMatch(
        /(?:^|,)\s*(?:no-cache|no-store)(?:\s*(?:,|$))/,
      );
    if (path.endsWith(".json"))
      expect(response.headers()["content-type"], path).toContain(
        "application/json",
      );
    expect(
      createHash("sha256")
        .update(await response.body())
        .digest("hex"),
      path,
    ).toBe(manifest.files[path]!.sha256);
  }
});

test("the local demo changes its record and resets without a service call", async ({
  page,
}) => {
  await page.goto("/webmcp");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("reorder-point")).toHaveText("1,240 units");
  await expect(page.getByTestId("tool-result")).toContainText(
    '"previousUnits": 800',
  );
  await page
    .getByRole("button", { name: "Reset example", exact: true })
    .click();
  await expect(page.getByTestId("reorder-point")).toHaveText("800 units");
});
