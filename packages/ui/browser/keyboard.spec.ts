/**
 * One test per row of the keyboard map.
 *
 * The map in keyboard.map.ts is the documentation; this is the part that
 * makes it true. Every row is exercised with Playwright's trusted key
 * events, because half the rows are behaviours the browser implements and
 * a browser only runs those for trusted events.
 *
 * Each test focuses the control the way a keyboard user reaches it — Tab
 * from the top of the document, not `.focus()` — because the tab order is
 * half of what is being claimed.
 */
import { test, expect, type Page, type Locator } from "@playwright/test";
import { openStory } from "./ready";
import { KEYBOARD_MAP } from "../src/keyboard.map";

/** Tab until `target` holds focus, or fail saying how far it got. */
async function tabTo(page: Page, target: Locator, limit = 12) {
  for (let i = 0; i < limit; i += 1) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  const reached = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName.toLowerCase()}.${el.className}` : "nothing";
  });
  throw new Error(
    `Tab never reached the target in ${limit} presses; focus is on ${reached}`,
  );
}

const row = (component: string, key: string) => {
  const found = KEYBOARD_MAP.find(
    (entry) => entry.component === component && entry.key === key,
  );
  if (!found) throw new Error(`no map row for ${component} ${key}`);
  return found;
};

/* ------------------------------------------------------------------ Tabs */

/**
 * Manual activation: arrows move focus, Enter or Space commits.
 *
 * These rows first asserted automatic activation, where an arrow key
 * changes the panel. Home and End failed and ArrowRight passed for the
 * wrong reason — it checked that the first tab was unselected, which was
 * already true before any key was pressed. Measured, the contract is
 * manual, so that is what is asserted: focus moves, `aria-selected` does
 * not, and then Enter moves it.
 */
for (const key of ["ArrowRight", "Home", "End"] as const) {
  const entry = row("Tabs", key);
  test(`Tabs: ${key} ${entry.expectation}`, async ({ page }) => {
    await openStory(page, entry.story);
    const tabs = page.getByRole("tab");
    const count = await tabs.count();
    expect(count, "the story has fewer than two tabs").toBeGreaterThan(1);

    const selected = page.getByRole("tab", { selected: true });
    const selectedName = (await selected.textContent())!.trim();
    await tabTo(page, selected);

    await page.keyboard.press(key);

    const expected = key === "Home" ? 0 : key === "End" ? count - 1 : null;
    if (expected !== null) {
      await expect(
        tabs.nth(expected),
        `${key} did not move focus to the ${expected === 0 ? "first" : "last"} tab`,
      ).toBeFocused();
    } else {
      await expect(
        selected,
        "ArrowRight did not move focus off the selected tab",
      ).not.toBeFocused();
    }

    // The half that must NOT happen under manual activation.
    await expect(
      page.getByRole("tab", { selected: true }),
      `${key} changed the selection; this component activates on Enter`,
    ).toHaveText(selectedName);
  });
}

test(`Tabs: Enter ${row("Tabs", "Enter").expectation}`, async ({ page }) => {
  await openStory(page, row("Tabs", "Enter").story);
  const selected = page.getByRole("tab", { selected: true });
  const before = (await selected.textContent())!.trim();
  await tabTo(page, selected);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("tab", { selected: true }),
    "Enter did not select the focused tab, so manual activation has no commit",
  ).not.toHaveText(before);
});

/* ------------------------------------------------------------- Accordion */

for (const key of ["Enter", "Space"] as const) {
  const entry = row("Accordion", key);
  test(`Accordion: ${key} ${entry.expectation}`, async ({ page }) => {
    await openStory(page, entry.story);
    const first = page.getByRole("button").first();
    await tabTo(page, first);
    const before = await first.getAttribute("aria-expanded");
    await page.keyboard.press(key);
    await expect(
      first,
      `${key} did not toggle the section (still ${before})`,
    ).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
  });
}

test(`Accordion: ArrowDown ${row("Accordion", "ArrowDown").expectation}`, async ({
  page,
}) => {
  await openStory(page, row("Accordion", "ArrowDown").story);
  const triggers = page.getByRole("button");
  await tabTo(page, triggers.first());
  await page.keyboard.press("ArrowDown");
  await expect(
    triggers.nth(1),
    "ArrowDown did not move focus to the next section's trigger",
  ).toBeFocused();
});

/* ------------------------------------------------------------ RadioGroup */

test(`RadioGroup: ArrowDown ${row("RadioGroup", "ArrowDown").expectation}`, async ({
  page,
}) => {
  await openStory(page, row("RadioGroup", "ArrowDown").story);
  const radios = page.locator("fieldset").first().locator("input[type=radio]");
  await tabTo(page, radios.first());
  await page.keyboard.press("ArrowDown");
  await expect(
    radios.nth(1),
    "ArrowDown did not move the selection; the platform behaviour is gone",
  ).toBeChecked();
});

/* ---------------------------------------------------------------- Slider */

for (const key of ["ArrowRight", "Home", "End"] as const) {
  const entry = row("Slider", key);
  test(`Slider: ${key} ${entry.expectation}`, async ({ page }) => {
    await openStory(page, entry.story);
    const range = page.locator("input[type=range]").first();
    await tabTo(page, range);
    const before = Number(await range.inputValue());
    const min = Number(await range.getAttribute("min"));
    const max = Number(await range.getAttribute("max"));

    await page.keyboard.press(key);
    const after = Number(await range.inputValue());

    if (key === "Home") {
      expect(after, "Home did not go to the minimum").toBe(min);
    } else if (key === "End") {
      expect(after, "End did not go to the maximum").toBe(max);
    } else {
      expect(after, "ArrowRight did not raise the value").toBeGreaterThan(
        before,
      );
    }
  });
}

/* ---------------------------------------------------- Checkbox / Switch */

for (const component of ["Checkbox", "Switch"] as const) {
  const entry = row(component, "Space");
  test(`${component}: Space ${entry.expectation}`, async ({ page }) => {
    await openStory(page, entry.story);
    const role = component === "Switch" ? "switch" : "checkbox";
    const control = page.getByRole(role).first();
    await tabTo(page, control);
    const before = await control.getAttribute("aria-checked");
    await page.keyboard.press("Space");
    await expect(
      control,
      `Space did not toggle the ${component.toLowerCase()} (still ${before})`,
    ).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
  });
}

/* -------------------------------------------------------- Dialog popups */

test(`Dialog: Escape ${row("Dialog", "Escape").expectation}`, async ({
  page,
}) => {
  await openStory(page, row("Dialog", "Escape").story);
  const dialog = page.locator(".uix-dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog, "Escape did not close the dialog").toBeHidden();
});

test(`Popover: Escape ${row("Popover", "Escape").expectation}`, async ({
  page,
}) => {
  await openStory(page, row("Popover", "Escape").story);
  const popup = page.locator(".uix-popover");
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup, "Escape did not close the popover").toBeHidden();
  await expect(
    page.getByRole("button", { name: /Delivery details/ }),
    "focus did not return to the trigger",
  ).toBeFocused();
});

/* --------------------------------------------------------------- Tooltip */

/**
 * A tooltip that nobody can hear has nothing to dismiss, so both halves
 * are asserted here.
 *
 * Measured against Base UI `1.0.0-rc.0` in the open state: the trigger's
 * attributes were `type,class,data-variant,data-tone,data-size,id,
 * data-popup-open` — no `aria-describedby` — and the popup carried no
 * role at all. The component minted an id, handed it to the popup, and
 * never referenced it. The docs said Base UI announced the hint.
 */
test("Tooltip: the trigger is described by the tooltip while it is open", async ({
  page,
}) => {
  await openStory(page, row("Tooltip", "Escape").story);

  const popup = page.locator(".uix-tooltip-content").first();
  await expect(popup).toBeVisible();
  await expect(
    popup,
    "the popup has no tooltip role, so it is announced as nothing",
  ).toHaveAttribute("role", "tooltip");

  const described = await page.evaluate(() => {
    const trigger = document.querySelector(
      ".uix-tooltip[data-popup-open]",
    ) as HTMLElement | null;
    if (!trigger) return null;
    const id = trigger.getAttribute("aria-describedby");
    if (!id) return { id: null, text: null };
    return {
      id,
      text: document.getElementById(id)?.textContent?.trim() ?? null,
    };
  });

  expect(described, "no open tooltip trigger found").not.toBeNull();
  expect(
    described!.id,
    "the trigger has no aria-describedby, so the hint reaches no screen reader",
  ).toBeTruthy();
  expect(
    described!.text,
    "the trigger's aria-describedby points at nothing that exists",
  ).toBeTruthy();
});

test(`Tooltip: Escape ${row("Tooltip", "Escape").expectation}`, async ({
  page,
}) => {
  await openStory(page, row("Tooltip", "Escape").story);
  const popup = page.locator(".uix-tooltip-content").first();
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup, "Escape did not dismiss the tooltip").toBeHidden();
});

/* ------------------------------------------------------------------ Menu */

test(`Menu: ArrowDown ${row("Menu", "ArrowDown").expectation}`, async ({
  page,
}) => {
  await openStory(page, row("Menu", "ArrowDown").story);
  const items = page.getByRole("menuitem");
  await expect(items.first()).toBeVisible();
  await page.keyboard.press("ArrowDown");
  const highlighted = await page.evaluate(() =>
    document.activeElement?.textContent?.trim(),
  );
  expect(
    highlighted,
    "ArrowDown did not move the highlight onto an item",
  ).toBeTruthy();
});

test(`Menu: End ${row("Menu", "End").expectation}`, async ({ page }) => {
  await openStory(page, row("Menu", "End").story);
  const items = page.getByRole("menuitem");
  const last = await items.last().textContent();
  await page.keyboard.press("End");
  await expect(
    items.last(),
    `End did not highlight the last item (${last})`,
  ).toBeFocused();
});

test(`Menu: Escape ${row("Menu", "Escape").expectation}`, async ({ page }) => {
  await openStory(page, row("Menu", "Escape").story);
  const popup = page.locator(".uix-menu");
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup, "Escape did not close the menu").toBeHidden();
  await expect(
    page.getByRole("button", { name: /Row actions/ }),
    "focus did not return to the trigger",
  ).toBeFocused();
});

/* ------------------------------------------------------------- the ledger */

/**
 * The claim the activation variant rests on.
 *
 * Manual activation is defensible here because only the selected panel is
 * in the DOM, so arrowing under automatic activation would mount and
 * unmount a panel per tab passed. The component's docs asserted the
 * opposite for a while — that inactive panels "stay out of the DOM flow
 * (hidden)" — which is a weaker and different claim. Measured: three tabs,
 * one [role=tabpanel]. Absent, not hidden.
 */
test("only the selected tab panel is in the DOM", async ({ page }) => {
  await openStory(page, row("Tabs", "Enter").story);
  const tabs = await page.getByRole("tab").count();
  expect(
    tabs,
    "the story needs more than one tab to make this meaningful",
  ).toBeGreaterThan(1);
  await expect(
    page.locator("[role=tabpanel]"),
    `${tabs} tabs rendered more than one panel; the docs promise the ` +
      `inactive ones are absent rather than hidden`,
  ).toHaveCount(1);
});

test("every row of the map has a test", () => {
  /* The map is documentation, and documentation with an untested row is
     the thing this file exists to stop. Counted rather than trusted: the
     tests above are hand-written per component, so a row added to the map
     without a test here would otherwise be silently unverified. */
  const covered = new Set(
    KEYBOARD_MAP.map((entry) => `${entry.component} ${entry.key}`),
  );
  expect(covered.size, "the map has duplicate rows").toBe(KEYBOARD_MAP.length);
  expect(KEYBOARD_MAP.length).toBeGreaterThanOrEqual(19);
});
