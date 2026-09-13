import { expect, test } from "@playwright/test";

// Opt in to the experimental browser API. Ordinary CI still checks the manual path.
const native = process.env["WEBMCP_NATIVE"] === "1";
test.use(
  native
    ? {
        channel: "chrome",
        launchOptions: { args: ["--enable-blink-features=WebMCP"] },
      }
    : {},
);

test("the manual proposal can be discarded or accepted", async ({ page }) => {
  await page.goto("/webmcp");
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "4711", exact: true }) });
  await page
    .getByRole("button", { name: "Call the proposal function" })
    .click();
  await expect(row).toContainText("1,240 units");
  await row.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(row).toContainText("800 units");
  await page
    .getByRole("button", { name: "Call the proposal function" })
    .click();
  await row.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(row).toContainText("1,240 units");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(row).toContainText("800 units");
});

test("native registered calls update the visible desk before and after reset", async ({
  page,
}) => {
  test.skip(
    !native,
    "Set WEBMCP_NATIVE=1 with installed Chrome supporting WebMCP",
  );
  await page.goto("/webmcp");
  await expect(
    page.getByText("Registered on this page", { exact: true }),
  ).toBeVisible();
  const invoke = (units: number) =>
    page.evaluate(async (value) => {
      const context = (
        document as Document & {
          modelContext: {
            getTools(): Promise<Array<{ name: string }>>;
            executeTool(
              tool: { name: string },
              input: string,
            ): Promise<unknown>;
          };
        }
      ).modelContext;
      const tool = (await context.getTools()).find(
        (candidate) => candidate.name === "propose_reorder_point",
      );
      if (!tool) throw new Error("The page did not register the proposal tool");
      return context.executeTool(
        tool,
        JSON.stringify({ sku: "4711", units: value }),
      );
    }, units);
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "4711", exact: true }) });
  await invoke(975);
  await expect(row).toContainText("975 units");
  await row.getByRole("button", { name: "Accept", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await invoke(1100);
  await expect(row).toContainText("1,100 units");
  await row.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(row).toContainText("800 units");
});
