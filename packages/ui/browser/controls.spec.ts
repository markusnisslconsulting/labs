import { expect, test } from "@playwright/test";
import { openStory } from "./ready";

test("every visible boolean control has an explicit initial value", async ({
  page,
}) => {
  await openStory(page, "components-button--solid-accent");
  const result = await page.evaluate(async () => {
    type Story = {
      initialArgs: Record<string, unknown>;
      argTypes: Record<
        string,
        { control?: false | { type?: string }; table?: { disable?: boolean } }
      >;
    };
    const preview = (
      window as unknown as {
        __STORYBOOK_PREVIEW__: {
          storyStore: {
            loadStory: (input: { storyId: string }) => Promise<Story>;
          };
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const index = (await (await fetch("./index.json")).json()) as {
      entries: Record<
        string,
        { id: string; type: string; title: string; tags: string[] }
      >;
    };
    const missing: string[] = [];
    let stories = 0;
    let controls = 0;
    for (const entry of Object.values(index.entries)) {
      if (
        entry.type !== "story" ||
        !entry.title.startsWith("Components/") ||
        !entry.tags.includes("dev")
      )
        continue;
      const story = await preview.storyStore.loadStory({ storyId: entry.id });
      stories++;
      for (const [name, arg] of Object.entries(story.argTypes)) {
        if (
          !arg.control ||
          arg.control.type !== "boolean" ||
          arg.table?.disable
        )
          continue;
        controls++;
        if (typeof story.initialArgs[name] !== "boolean")
          missing.push(`${entry.id}: ${name}`);
      }
    }
    return { stories, controls, missing };
  });
  expect(result.stories).toBeGreaterThan(100);
  expect(result.controls).toBeGreaterThan(50);
  expect(result.missing).toEqual([]);
});

test("Button controls are toggles that change the rendered component", async ({
  page,
}) => {
  await page.goto("/?path=/story/components-button--solid-accent");
  const button = page
    .frameLocator("#storybook-preview-iframe")
    .getByRole("button", { name: "Run the agent", exact: true });
  await expect(button).toBeEnabled();
  await page.getByRole("tab", { name: /^Controls/ }).click();
  await expect(
    page.getByRole("button", { name: "Set boolean", exact: true }),
  ).toHaveCount(0);
  const disabled = page.getByRole("switch", { name: "disabled", exact: true });
  await page.locator('label[for="control-disabled"]').click();
  await expect(disabled).toBeChecked();
  await expect(button).toBeDisabled();
  await page.locator('label[for="control-disabled"]').click();
  await expect(disabled).not.toBeChecked();
  await expect(button).toBeEnabled();
  await page.locator('label[for="control-loading"]').click();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Button");
});

test("controlled stories synchronize component interaction and Controls", async ({
  page,
}) => {
  await page.goto("/?path=/story/components-switch--off");
  const control = page
    .frameLocator("#storybook-preview-iframe")
    .getByRole("switch", { name: "Compact rows", exact: true });
  await expect(control).not.toBeChecked();
  await page.getByRole("tab", { name: /^Controls/ }).click();
  const checked = page.getByRole("switch", { name: "checked", exact: true });
  await control.click();
  await expect(control).toBeChecked();
  await expect(checked).toBeChecked();
  await page.locator('label[for="control-checked"]').click();
  await expect(control).not.toBeChecked();
  await page
    .getByRole("button", { name: "Reset controls", exact: true })
    .click();
  await expect(control).not.toBeChecked();
});

test("events stay in the Docs props table and out of Controls", async ({
  page,
}) => {
  await page.goto("/?path=/story/components-checkbox--unchecked");
  await page
    .frameLocator("#storybook-preview-iframe")
    .getByRole("checkbox", { name: "Email me updates", exact: true })
    .waitFor();
  await page.getByRole("tab", { name: /^Controls/ }).click();
  await expect(
    page.getByRole("cell", { name: "onCheckedChange", exact: true }),
  ).toHaveCount(0);
  await page.goto("/iframe.html?id=components-checkbox--docs&viewMode=docs");
  await expect(
    page.getByRole("cell", { name: "onCheckedChange", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Events", { exact: true })).toBeVisible();
});
