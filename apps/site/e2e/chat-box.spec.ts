import { expect, test, type Page } from "@playwright/test";
async function proposal(page: Page) {
  await page
    .getByRole("button", { name: "Request Billing assignment" })
    .click();
  await expect(
    page.getByRole("button", { name: "Save assignment", exact: true }),
  ).toHaveCount(2);
}
const additional = (page: Page) =>
  page
    .getByText("Try a refusal, a colleague's edit, or a reversal", {
      exact: true,
    })
    .click();

test("both review surfaces share the proposal, pending save, and acknowledged result", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await proposal(page);
  const save = page.getByRole("button", {
    name: "Save assignment",
    exact: true,
  });
  await expect(save).toHaveCount(2);
  await save.first().click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toHaveCount(2);
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await expect(page.getByTestId("saved-team")).toHaveText("Billing");
  await expect(save).toHaveCount(0);
  await page.getByRole("button", { name: "Reset example" }).click();
  await proposal(page);
  await page
    .getByRole("button", { name: "Discard", exact: true })
    .last()
    .click();
  await expect(save).toHaveCount(0);
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
});

test("a refusal keeps the proposal and allows retry from the other view", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await proposal(page);
  await additional(page);
  await page.getByRole("checkbox", { name: "Refuse next save" }).check();
  await page.getByRole("button", { name: "Save assignment" }).first().click();
  await expect(page.getByRole("status")).toContainText("refused this save");
  await expect(page.getByTestId("service-team")).toHaveText("General Support");
  await page.getByRole("button", { name: "Save assignment" }).last().click();
  await expect(page.getByTestId("saved-team")).toHaveText("Billing");
});

test("a conflict requires a new review and preserves the colleague's edit", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await proposal(page);
  await additional(page);
  await page
    .getByRole("button", { name: "Colleague assigns Technical Support" })
    .click();
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await page.getByRole("button", { name: "Save assignment" }).first().click();
  const review = page.getByRole("button", { name: "Review latest assignment" });
  await expect(review).toHaveCount(2);
  await expect(page.getByTestId("service-team")).toHaveText(
    "Technical Support",
  );
  await expect(
    page.getByRole("button", { name: "Save assignment" }),
  ).toHaveCount(0);
  await review.first().click();
  await page.getByRole("button", { name: "Save assignment" }).last().click();
  await expect(page.getByTestId("saved-team")).toHaveText("Billing");
});

test("restoring a previous assignment encounters the same version conflict", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await proposal(page);
  await page.getByRole("button", { name: "Save assignment" }).first().click();
  await expect(page.getByTestId("saved-team")).toHaveText("Billing");
  await additional(page);
  await page
    .getByRole("button", { name: "Colleague assigns Technical Support" })
    .click();
  await page
    .getByRole("button", { name: "Review previous assignment" })
    .click();
  await page.getByRole("button", { name: "Save assignment" }).first().click();
  await expect(
    page.getByRole("button", { name: "Review latest assignment" }),
  ).toHaveCount(2);
  await expect(page.getByTestId("service-team")).toHaveText(
    "Technical Support",
  );
});

test("reset cancels an in-flight response so it cannot update the new example", async ({
  page,
}) => {
  await page.goto("/chat-box");
  await proposal(page);
  await page.getByRole("button", { name: "Save assignment" }).first().click();
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.waitForTimeout(900);
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await expect(
    page.getByRole("button", { name: "Save assignment" }),
  ).toHaveCount(0);
});

test("expanded event details fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat-box");
  await proposal(page);
  await page
    .getByText("Inspect the agent events and proposal", { exact: true })
    .click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});
