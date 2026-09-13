import { expect, test } from "@playwright/test";

test("either review surface resolves the shared proposal", async ({ page }) => {
  await page.goto("/chat-box");
  const stream = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Follow a proposal from the assistant to the screen",
      }),
    });
  await stream.getByRole("button", { name: "Play scripted proposal" }).click();
  await expect(
    stream.getByRole("button", { name: "Accept proposal", exact: true }),
  ).toHaveCount(2);
  await stream
    .getByRole("button", { name: "Accept proposal", exact: true })
    .first()
    .click();
  await expect(
    stream.getByRole("cell", { name: "1,240", exact: true }),
  ).toBeVisible();
  await expect(
    stream.getByRole("button", { name: "Accept proposal", exact: true }),
  ).toHaveCount(0);
  await stream.getByRole("button", { name: "Play scripted proposal" }).click();
  await stream
    .getByRole("button", { name: "Discard proposal", exact: true })
    .last()
    .click();
  await expect(
    stream.getByRole("cell", { name: "800", exact: true }),
  ).toBeVisible();
});

test("save and restore each need a reviewed write and keep both receipts", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await page
    .getByRole("button", { name: "Propose 1,240", exact: true })
    .click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "800 units · version 1",
  );
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "1,240 units · version 2",
  );
  await page
    .getByRole("button", { name: "Review restore to previous value" })
    .click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "1,240 units · version 2",
  );
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "800 units · version 3",
  );
  const history = page.getByRole("table", {
    name: "Successful writes in this tab",
  });
  await expect(history.getByRole("row")).toHaveCount(3);
  await expect(
    history.getByRole("cell", { name: "800 → 1,240", exact: true }),
  ).toBeVisible();
  await expect(
    history.getByRole("cell", { name: "1,240 → 800", exact: true }),
  ).toBeVisible();
});

test("a colleague's edit blocks a stale restore", async ({ page }) => {
  await page.goto("/chat-box");
  await page
    .getByRole("button", { name: "Propose 1,240", exact: true })
    .click();
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "1,240 units · version 2",
  );
  await page
    .getByRole("button", { name: "Colleague saves a different value" })
    .click();
  await page
    .getByRole("button", { name: "Review restore to previous value" })
    .click();
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(
    page.getByRole("button", { name: "Review against latest value" }),
  ).toBeVisible();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "1,340 units · version 3",
  );
  await expect(
    page.getByRole("button", { name: "Save reviewed value" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Review against latest value" })
    .click();
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "800 units · version 4",
  );
});

test("a refused save leaves the store unchanged and can be retried", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await page
    .getByRole("button", { name: "Propose 1,240", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Refuse the next save before writing" })
    .check();
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(
    page.getByText("The simulated store refused this save without writing.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "800 units · version 1",
  );
  await page.getByRole("button", { name: "Save reviewed value" }).click();
  await expect(page.getByTestId("stored-record")).toHaveText(
    "1,240 units · version 2",
  );
});
