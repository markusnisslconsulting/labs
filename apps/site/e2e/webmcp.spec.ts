import { expect, test, type Page } from "@playwright/test";
const native = process.env["WEBMCP_NATIVE"] === "1";
test.use(
  native
    ? {
        channel: "chrome",
        launchOptions: { args: ["--enable-blink-features=WebMCP"] },
      }
    : {},
);

function invoke(page: Page, units: number) {
  return page.evaluate(async (value) => {
    const context = (
      document as Document & {
        modelContext: {
          getTools(): Promise<Array<{ name: string }>>;
          executeTool(tool: { name: string }, input: string): Promise<unknown>;
        };
      }
    ).modelContext;
    const tool = (await context.getTools()).find(
      (candidate) => candidate.name === "set_reorder_point",
    );
    if (!tool) throw new Error("No setter registered");
    // Chrome 152 accepts serialized arguments; later drafts also accept objects.
    return context.executeTool(
      tool,
      JSON.stringify({ sku: "4711", units: value }),
    );
  }, units);
}
async function names(page: Page) {
  return page.evaluate(async () => {
    const context = (
      document as Document & {
        modelContext: { getTools(): Promise<Array<{ name: string }>> };
      }
    ).modelContext;
    return (await context.getTools()).map((tool) => tool.name);
  });
}

test("Save and an explicit call share validation and the returned record", async ({
  page,
}) => {
  await page.goto("/webmcp");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("reorder-point")).toHaveText("1,240 units");
  await expect(page.getByTestId("tool-result")).toContainText(
    '"previousUnits": 800',
  );
  await page
    .getByLabel("Tool arguments (JSON)")
    .fill('{"sku":"4711","units":900}');
  await page
    .getByRole("button", { name: "Call setReorderPoint directly", exact: true })
    .click();
  await expect(page.getByTestId("reorder-point")).toHaveText("900 units");
  await expect(page.getByTestId("tool-result")).toContainText(
    '"previousUnits": 1240',
  );
  await page
    .getByLabel("Tool arguments (JSON)")
    .fill('{"sku":"unknown","units":100}');
  await page
    .getByRole("button", { name: "Call setReorderPoint directly", exact: true })
    .click();
  await expect(page.getByTestId("tool-result")).toContainText('"ok": false');
  await expect(page.getByTestId("reorder-point")).toHaveText("900 units");
});

test("native setter, removal, and reset preserve the form path", async ({
  page,
}) => {
  test.skip(!native, "Requires installed Chrome with experimental WebMCP");
  await page.goto("/webmcp");
  await expect.poll(() => names(page)).toContain("set_reorder_point");
  await invoke(page, 975);
  await expect(page.getByTestId("reorder-point")).toHaveText("975 units");
  await page
    .getByRole("button", { name: "Reset example", exact: true })
    .click();
  await invoke(page, 1100);
  await expect(page.getByTestId("reorder-point")).toHaveText("1,100 units");
  await invoke(page, -1);
  await expect(page.getByTestId("reorder-point")).toHaveText("1,100 units");
  await page.getByRole("button", { name: "Remove tool", exact: true }).click();
  await expect.poll(() => names(page)).not.toContain("set_reorder_point");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("reorder-point")).toHaveText("1,240 units");
});

test("a declarative tool fills the form and returns a result only after submission", async ({
  page,
}) => {
  test.skip(!native, "Requires installed Chrome with experimental WebMCP");
  await page.goto("/webmcp");
  await page.getByLabel("How the page declares its tool").selectOption("form");
  await expect.poll(() => names(page)).toContain("set_reorder_point");
  const pending = invoke(page, 900);
  await expect(page.getByLabel("Reorder point, in units")).toHaveValue("900");
  await expect(page.getByTestId("reorder-point")).toHaveText("800 units");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect(String(await pending)).toContain('"units":900');
  await expect(page.getByTestId("reorder-point")).toHaveText("900 units");
  await page
    .getByLabel("How the page declares its tool")
    .selectOption("autosubmit");
  await expect.poll(() => names(page)).toContain("set_reorder_point");
  expect(String(await invoke(page, 1000))).toContain('"previousUnits":900');
  await expect(page.getByTestId("reorder-point")).toHaveText("1,000 units");
});
