import { expect, test, type Page } from "@playwright/test";

// Deterministic API doubles check the lab's calls and lifecycle, not model quality.
async function installApis(page: Page) {
  await page.addInitScript(() => {
    const state = {
      calls: [] as Array<{ api: string; method: string; input?: unknown }>,
      detected: "de",
      failure: "",
      quota: 1000,
    };
    Object.assign(window, { aiTest: state });
    function api(name: string) {
      return class {
        static async availability(options?: unknown) {
          state.calls.push({
            api: name,
            method: "availability",
            input: options,
          });
          return "downloadable";
        }
        static async create(options?: unknown) {
          state.calls.push({ api: name, method: "create", input: options });
          return new this();
        }
        destroy() {
          state.calls.push({ api: name, method: "destroy" });
        }
        async detect(text: string) {
          state.calls.push({ api: name, method: "detect", input: text });
          return [{ detectedLanguage: state.detected, confidence: 0.98 }];
        }
        async translate(text: string) {
          state.calls.push({ api: name, method: "translate", input: text });
          if (state.failure) throw new Error(state.failure);
          return "Customer Meier asks where order 4711 is.";
        }
        async measureInputUsage() {
          return 80;
        }
        get inputQuota() {
          return state.quota;
        }
        async summarize(text: string) {
          state.calls.push({ api: name, method: "summarize", input: text });
          return "Replacement shipped. Friday arrival was requested.";
        }
        summarizeStreaming(text: string) {
          state.calls.push({ api: name, method: "stream", input: text });
          return new ReadableStream({
            start(controller) {
              controller.enqueue("Replacement ");
              controller.enqueue("shipped.");
              controller.close();
            },
          });
        }
        async prompt(text: string, options: unknown) {
          state.calls.push({
            api: name,
            method: "prompt",
            input: { text, options },
          });
          return JSON.stringify({
            orderNumber: text.includes("4711") ? "4711" : "",
            issue: "Delivery status",
          });
        }
      };
    }
    for (const name of [
      "Translator",
      "LanguageDetector",
      "Summarizer",
      "LanguageModel",
    ])
      Object.defineProperty(window, name, {
        configurable: true,
        value: api(name),
      });
  });
}
async function state(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          aiTest: {
            calls: Array<{ api: string; method: string; input?: unknown }>;
          };
        }
      ).aiTest,
  );
}

test("translation works before detection, and detecting does not start translation", async ({
  page,
}) => {
  await installApis(page);
  await page.goto("/on-device-ai");
  await page.getByRole("button", { name: "Translate to English" }).click();
  await expect(
    page
      .getByLabel("English translation")
      .getByText("Customer Meier asks where order 4711 is.", { exact: true }),
  ).toBeVisible();
  let calls = (await state(page)).calls;
  expect(
    calls.some(
      (call) => call.api === "LanguageDetector" && call.method === "create",
    ),
  ).toBe(false);
  expect(
    calls.filter(
      (call) => call.api === "Translator" && call.method === "destroy",
    ),
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "Detect language", exact: true })
    .click();
  await expect(
    page.getByText("de · confidence 0.980", { exact: true }),
  ).toBeVisible();
  calls = (await state(page)).calls;
  expect(
    calls.filter(
      (call) => call.api === "Translator" && call.method === "create",
    ),
  ).toHaveLength(1);
  expect(
    calls.filter(
      (call) => call.api === "LanguageDetector" && call.method === "destroy",
    ),
  ).toHaveLength(1);
});

test("failed translation destroys its instance and leaves a retry", async ({
  page,
}) => {
  await installApis(page);
  await page.goto("/on-device-ai");
  await page.evaluate(() => {
    (window as unknown as { aiTest: { failure: string } }).aiTest.failure =
      "Translation failed for testing";
  });
  await page.getByRole("button", { name: "Translate to English" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Translation failed for testing",
  );
  expect(
    (await state(page)).calls.filter(
      (call) => call.api === "Translator" && call.method === "destroy",
    ),
  ).toHaveLength(1);
  await expect(
    page.getByRole("button", { name: "Translate to English" }),
  ).toBeEnabled();
});

test("summary uses the visible input, matching options, quota, and streamed chunks", async ({
  page,
}) => {
  await installApis(page);
  await page.goto("/on-device-ai");
  await page
    .getByLabel("Conversation to summarize")
    .fill("A replacement was shipped.");
  await page.getByLabel("Summary type").selectOption("headline");
  await page
    .getByRole("checkbox", { name: "Stream the result as it arrives" })
    .check();
  await page.getByRole("button", { name: "Summarize conversation" }).click();
  await expect(
    page.getByText("Replacement shipped.", { exact: true }),
  ).toBeVisible();
  let calls = (await state(page)).calls;
  expect(
    calls.findLast(
      (call) => call.api === "Summarizer" && call.method === "create",
    )?.input,
  ).toMatchObject({
    type: "headline",
    format: "plain-text",
    length: "short",
    expectedInputLanguages: ["en"],
    outputLanguage: "en",
  });
  expect(calls.findLast((call) => call.method === "stream")?.input).toBe(
    "A replacement was shipped.",
  );
  await page.evaluate(() => {
    (window as unknown as { aiTest: { quota: number } }).aiTest.quota = 10;
  });
  await page.getByRole("button", { name: "Summarize conversation" }).click();
  await expect(page.getByRole("alert")).toContainText("too long");
  calls = (await state(page)).calls;
  expect(calls.filter((call) => call.method === "stream")).toHaveLength(1);
  expect(
    calls.filter(
      (call) => call.api === "Summarizer" && call.method === "destroy",
    ),
  ).toHaveLength(2);
});

test("extraction has its own English input and the article's missing-field instructions", async ({
  page,
}) => {
  await installApis(page);
  await page.goto("/on-device-ai");
  await page
    .getByLabel("English message to extract from")
    .fill("Customer Meier asks where the delivery is.");
  await page
    .getByRole("button", { name: "Extract order number and issue" })
    .click();
  await expect(
    page.locator("pre").filter({ hasText: '"orderNumber": ""' }),
  ).toBeVisible();
  const calls = (await state(page)).calls;
  expect(
    calls.find(
      (call) => call.api === "LanguageModel" && call.method === "create",
    )?.input,
  ).toMatchObject({
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  });
  expect(calls.find((call) => call.method === "prompt")?.input).toMatchObject({
    text: expect.stringContaining(
      "Use an empty string for a field that is missing.",
    ),
    options: { responseConstraint: { additionalProperties: false } },
  });
  expect(
    calls.filter(
      (call) => call.api === "LanguageModel" && call.method === "destroy",
    ),
  ).toHaveLength(1);
});
