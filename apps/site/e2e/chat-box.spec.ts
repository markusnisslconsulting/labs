import { expect, test, type Page } from "@playwright/test";
async function start(
  page: Page,
  mode: "agui" | "a2ui" = "agui",
  choose = false,
) {
  await page.goto("/chat-box");
  if (mode === "a2ui")
    await page
      .getByRole("tab", { name: "A2UI · component description" })
      .click();
  if (choose)
    await page
      .getByRole("combobox", { name: "Request", exact: true })
      .selectOption("choose");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save assignment", exact: true }),
  ).toBeEnabled();
}
async function payloads(page: Page): Promise<Record<string, any>[]> {
  return (await page.locator("pre.demo-call").allTextContents()).map((text) =>
    JSON.parse(text),
  );
}
test("AG-UI receives proposal state and returns the real service outcome in a follow-up run", async ({
  page,
}) => {
  await start(page);
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Saving…");
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await expect(page.getByRole("status")).toHaveText(
    "Saved: this ticket is assigned to Billing.",
  );
  await expect(page.getByTestId("saved-team")).toHaveText("Billing");
  const messages = await payloads(page);
  const runs = messages.filter((value) => value.messages);
  expect(runs).toHaveLength(2);
  expect(runs[0].context[0].value).toBe("T-104");
  const result = runs[1].messages.at(-1);
  expect(result.toolCallId).toBe("review-1");
  expect(JSON.parse(result.content)).toEqual({
    kind: "saved",
    ticket: { ticketId: "T-104", teamId: "billing" },
  });
});
test("AG-UI discard and refusal both reach the assistant without a record change", async ({
  page,
}) => {
  for (const action of ["discard", "refuse"]) {
    await start(page);
    if (action === "refuse")
      await page
        .getByRole("checkbox", { name: "Have the service refuse this save" })
        .check();
    await page
      .getByRole("button", {
        name: action === "discard" ? "Discard" : "Save assignment",
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText(
      action === "discard" ? "discarded" : "refused",
    );
    await expect(page.getByTestId("saved-team")).toHaveText("General Support");
    const runs = (await payloads(page)).filter((value) => value.messages);
    expect(JSON.parse(runs[1].messages.at(-1).content).kind).toBe(
      action === "discard" ? "discarded" : "refused",
    );
  }
});
test("A2UI binds a selected team, sends resolved action context, and updates the same surface", async ({
  page,
}) => {
  await start(page, "a2ui", true);
  await page
    .getByRole("combobox", { name: "Assign to", exact: true })
    .selectOption("technical-support");
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(page.getByTestId("saved-team")).toHaveText("Technical Support");
  await expect(
    page.getByRole("button", { name: "Save assignment", exact: true }),
  ).toHaveCount(0);
  const messages = await payloads(page);
  const action = messages.find((value) => value.action)?.action;
  expect(action).toMatchObject({
    name: "save_assignment",
    surfaceId: "ticket-assignment",
    sourceComponentId: "save",
    context: { ticketId: "T-104", teamId: "technical-support" },
  });
  expect(messages.filter((value) => value.createSurface)).toHaveLength(1);
  expect(
    messages.some(
      (value) =>
        value.updateDataModel?.path === "/status" &&
        value.updateDataModel.value.includes("Technical Support"),
    ),
  ).toBe(true);
});
test("editing A2UI JSON changes rendered content and invalid input preserves the surface", async ({
  page,
}) => {
  await start(page, "a2ui");
  await page.getByText("Change the A2UI message", { exact: true }).click();
  const editor = page.getByRole("textbox", { name: "A2UI message JSON" });
  const message = JSON.parse(await editor.inputValue());
  message.updateComponents.components.find(
    (node: { id: string }) => node.id === "title",
  ).text = "Review this routing choice";
  await editor.fill(JSON.stringify(message));
  await page.getByRole("button", { name: "Apply message" }).click();
  await expect(
    page.getByText("Review this routing choice", { exact: true }),
  ).toBeVisible();
  message.updateComponents.components.find(
    (node: { id: string }) => node.id === "root",
  ).component = "Unsupported";
  await editor.fill(JSON.stringify(message));
  await page.getByRole("button", { name: "Apply message" }).click();
  await expect(page.getByRole("status")).toContainText("could not be applied");
  await expect(
    page.getByText("Review this routing choice", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save assignment", exact: true }),
  ).toBeEnabled();
});
test("A2UI refusal updates status, allows retry, and discard deletes its surface", async ({
  page,
}) => {
  await start(page, "a2ui", true);
  await page
    .getByRole("checkbox", { name: "Have the service refuse this save" })
    .check();
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("refused");
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(page.getByTestId("saved-team")).toHaveText("Billing");
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Discard", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("discarded");
  await expect(
    page.getByRole("button", { name: "Save assignment", exact: true }),
  ).toHaveCount(0);
  expect(
    (await payloads(page)).some(
      (value) => value.deleteSurface?.surfaceId === "ticket-assignment",
    ),
  ).toBe(true);
});
test("reset and mode switching cancel pending messages and saves", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByTestId("saved-team")).toHaveText("General Support");
  expect(await payloads(page)).toHaveLength(0);
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await page.getByRole("tab", { name: "A2UI · component description" }).click();
  await page.waitForTimeout(1600);
  await expect(
    page.getByRole("button", { name: "Send request", exact: true }),
  ).toBeEnabled();
  expect(await payloads(page)).toHaveLength(0);
});
test("the A2UI picker, editor and message inspector work on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, "a2ui", true);
  const picker = page.getByRole("combobox", { name: "Assign to", exact: true });
  await picker.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(picker).toHaveValue("technical-support");
  await page.getByText("Change the A2UI message", { exact: true }).click();
  await page.getByText("Inspect the exchange", { exact: true }).click();
  await page
    .locator("details details summary")
    .filter({ hasText: "updateComponents" })
    .first()
    .click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("malformed bindings preserve the surface and empty picker bindings show no false selection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page, "a2ui", true);
  await page.getByText("Change the A2UI message", { exact: true }).click();
  const editor = page.getByRole("textbox", { name: "A2UI message JSON" });
  for (const path of [
    "/bad~",
    "/normal\n/__proto__/polluted",
    "/normal\u2028/constructor/value",
  ]) {
    await editor.fill(
      JSON.stringify({
        version: "v0.9.1",
        updateComponents: {
          surfaceId: "ticket-assignment",
          components: [{ id: "title", component: "Text", text: { path } }],
        },
      }),
    );
    await page.getByRole("button", { name: "Apply message" }).click();
    await expect(page.getByRole("status")).toContainText(
      "could not be applied",
    );
    await expect(
      page.getByRole("combobox", { name: "Assign to", exact: true }),
    ).toHaveValue("billing");
  }
  expect(errors).toEqual([]);
  await editor.fill(
    JSON.stringify({
      version: "v0.9.1",
      updateDataModel: { surfaceId: "ticket-assignment", path: "/draft/team" },
    }),
  );
  await page.getByRole("button", { name: "Apply message" }).click();
  const picker = page.getByRole("combobox", { name: "Assign to", exact: true });
  await expect(picker).toHaveValue("");
  await expect(picker.locator("option:checked")).toHaveText("Choose a team");
  await picker.selectOption("billing");
  await picker.selectOption("");
  const edits = (await payloads(page)).filter(
    (value) => value.path === "/draft/team",
  );
  expect(edits.at(-1)?.value).toEqual([]);
  await picker.selectOption("technical-support");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(page.getByTestId("saved-team")).toHaveText("Technical Support");
});
