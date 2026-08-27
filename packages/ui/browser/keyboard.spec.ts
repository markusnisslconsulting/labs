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

/**
 * Which rows this file asked for, filled as the module loads.
 *
 * The coverage test at the bottom reads it. It has to be filled at load
 * time rather than while the tests run, because `fullyParallel` spreads
 * this file's tests over workers and each worker holds its own module —
 * a set filled during the run would be missing whatever another worker
 * did, in a way that depends on how many cores are free.
 *
 * That is why every test looks its row up at module scope, in a `const`
 * or in the test's own title. A lookup that happens only inside a test
 * body is invisible here and the coverage test will say so.
 */
const requested = new Set<string>();

const row = (component: string, key: string) => {
  const found = KEYBOARD_MAP.find(
    (entry) => entry.component === component && entry.key === key,
  );
  if (!found) throw new Error(`no map row for ${component} ${key}`);
  requested.add(`${component} ${key}`);
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
  /* Scoped by class, not by element. `page.locator("fieldset").first()`
     was the same shape of mistake the Toolbar tests were caught by: the
     `.first()` silences Playwright's strict mode, so an extra fieldset on
     the page — a `Form.Group`, another radio group — is picked up without
     a word. */
  const radios = page
    .locator(".uix-radiogroup")
    .first()
    .locator("input[type=radio]");
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

/* ---------------------------------------------------------------- Drawer */

const DRAWER_ESCAPE = row("Drawer", "Escape");

/**
 * Escape closes a drawer, modal or not.
 *
 * Its own row rather than an assumption that Dialog's covers it, because a
 * drawer is the one popup here that is sometimes not modal — and a
 * non-modal panel is exactly where "Escape closes it" is easiest to lose,
 * since nothing about the page behind is different while it is open.
 *
 * The fixture holds exactly one panel, and that was a measurement rather
 * than a preference. This test first opened the matrix, which has three
 * siblings, and asserted that one press closes the one on top — measured,
 * a single Escape closes **all three**. Each Base UI root handles the key
 * for itself and these are siblings rather than nested, so there is no
 * "top" for them to agree on. That may be worth changing; what it is not
 * is a keyboard contract this row can state, so the row states the one
 * that holds.
 *
 * And it is the non-modal panel deliberately: nothing about the page
 * behind a non-modal drawer changes while it is open, so "Escape closes
 * it" is the claim most easily lost there without anybody noticing.
 *
 * Break-verified on the third attempt, and the two that failed are worth
 * recording because both looked convincing. Passing `onOpenChange={() => {}}`
 * changed nothing: this fixture is uncontrolled, so Base UI holds the open
 * state itself and that prop is a notification rather than a veto. Nor did
 * `onKeyDown` with `stopPropagation` on the popup, because Base UI listens
 * above it. What does break it is making the panel controlled and stuck
 * open — which is also the shape of the real regression, a caller wiring
 * `open` and forgetting to handle the close.
 */
test(`Drawer: Escape ${DRAWER_ESCAPE.expectation}`, async ({ page }) => {
  await openStory(page, DRAWER_ESCAPE.story);
  const panel = page.locator(".uix-drawer");
  await expect(panel).toHaveCount(1);

  await page.keyboard.press("Escape");

  /* Retried by toHaveCount, which matters: closing runs a 200ms exit
     transition and the panel stays in the DOM for the whole of it. */
  await expect(panel, "Escape did not close the panel").toHaveCount(0);
});

/* ------------------------------------------------------------- DataTable */

const DATATABLE_SORT = row("DataTable", "Enter");
const DATATABLE_SELECT = row("DataTable", "Space");
const DATATABLE_SCROLL = row("DataTable", "ArrowDown");

/**
 * Enter on a column header sorts by that column.
 *
 * A platform row, and the reason the header is a real `<button>` rather
 * than a `<th>` with a click handler. A click handler on a table cell
 * cannot be reached by a keyboard at all, and the usual repair — adding
 * `tabindex` and a keydown listener — reimplements what a button already
 * does, minus whatever the listener forgets. Here the only claim is that
 * nothing took the platform's behaviour away.
 *
 * Scoped to one table by its caption. This story renders four, and the
 * lesson that made that explicit is in `runtime.spec.ts`: a bare `thead
 * th` in this Storybook matches its own zero-height args table.
 */
test("Enter on a column header sorts by that column", async ({ page }) => {
  await openStory(page, DATATABLE_SORT.story);
  const table = page.getByRole("region", { name: "Suppliers", exact: true });

  const header = table.getByRole("columnheader", { name: /Supplier/ });
  await expect(header).toHaveAttribute("aria-sort", "none");

  await table.getByRole("button", { name: /Supplier/ }).focus();
  await page.keyboard.press("Enter");

  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(table.getByRole("cell").first()).toHaveText("Adria Components");
});

/**
 * Space on a row's checkbox selects the row.
 *
 * The platform's, and the reason the selection column holds a native
 * `<input type="checkbox">` and not a styled `<div>`. Space on a checkbox
 * is behaviour a browser gives for free and only for a trusted event —
 * `userEvent.keyboard` would report success here whatever the markup was.
 */
test("Space on a row checkbox selects the row", async ({ page }) => {
  await openStory(page, DATATABLE_SELECT.story);
  const table = page.getByRole("region", {
    name: "Suppliers, two selected",
    exact: true,
  });

  const box = table.getByRole("checkbox", {
    name: "Select Vale Packaging",
    exact: true,
  });
  await expect(box).not.toBeChecked();

  await box.focus();
  await page.keyboard.press(" ");

  await expect(box).toBeChecked();
  await expect(
    page.getByRole("status").filter({ hasText: "selected" }).first(),
  ).toHaveText("3 rows selected");
});

/**
 * ArrowDown scrolls the viewport, which is why it is a tab stop.
 *
 * The whole justification for `tabindex="0"` on a scroll container, and
 * the rule this library changed its eslint config for. `overflow` makes a
 * region a pointer can scroll and a keyboard cannot reach; the repair is a
 * tab stop, and a tab stop that does not then respond to arrow keys would
 * be a stop that leads nowhere — exactly what the lint rule is right to
 * object to in every other case.
 */
test("ArrowDown scrolls a focused table viewport", async ({ page }) => {
  await openStory(page, DATATABLE_SCROLL.story);
  const viewport = page.locator(".uix-datatable-viewport");

  await viewport.focus();
  expect(await viewport.evaluate((node) => node.scrollTop)).toBe(0);

  for (let press = 0; press < 5; press += 1) {
    await page.keyboard.press("ArrowDown");
  }

  /* Polled, because Chromium animates keyboard scrolling. Measured: one
     ArrowDown moves this viewport 40px, and a read taken immediately after
     the last press returns 0 — so the first version of this test reported
     that arrow keys do not scroll a focused container, which is the
     opposite of the truth and would have argued for removing the tab stop
     that makes the region reachable at all. */
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollTop), {
      message:
        "the focused viewport did not scroll, so its tab stop leads nowhere",
    })
    .toBeGreaterThan(0);
});

/* ------------------------------------------------------------------ Form */

const FORM_ENTER = row("Form", "Enter");

/**
 * Enter in a text field submits the form.
 *
 * The platform row that made this file's premise concrete. Implicit
 * submission is the browser's behaviour, not ours, and it has conditions a
 * component library can remove without noticing: a submit button has to
 * exist inside the form, and nothing may swallow the key on the way.
 *
 * It cannot be asserted from a play function. `userEvent.keyboard`
 * dispatches an untrusted event and a browser runs implicit submission
 * only for a trusted one, so a story would report success while the
 * behaviour was gone — which is what the `owner: "platform"` distinction
 * exists for.
 *
 * The fixture is `Grouped`, and both halves of that choice were forced by
 * a break test that failed to break. It has no `play` function: a story
 * that has one autoplays in a built Storybook, and `openStory` waits for
 * the render rather than for play to finish, so the first fixture tabbed
 * the focus out from under this test. And it has **two** text fields.
 * HTML's implicit submission needs either a submit button or at most one
 * field that blocks it, so against a fixture with a single text input,
 * deleting the submit button changes nothing and the break test passes
 * while claiming to have broken something.
 *
 * Counted rather than read off the event. The first version asked a
 * listener on the form for `event.defaultPrevented` and got `false`
 * against a working component: React 19 delegates to the root container,
 * so its handler — the one that calls `preventDefault` — runs after any
 * listener on the form itself. What the page does is the durable
 * observation.
 */
test("Enter in a text field submits the form", async ({ page }) => {
  await openStory(page, FORM_ENTER.story);
  const before = page.url();

  await page.evaluate(() => {
    const store = window as unknown as Record<string, unknown>;
    store["__submits"] = 0;
    document.querySelector("form.uix-form")!.addEventListener("submit", () => {
      store["__submits"] = (store["__submits"] as number) + 1;
    });
  });

  await page.getByRole("textbox", { name: "Warehouse", exact: true }).focus();
  await page.keyboard.press("Enter");

  expect(
    await page.evaluate(
      () => (window as unknown as Record<string, unknown>)["__submits"],
    ),
    "Enter in a text field did not submit; either no submit button is in " +
      "the form or something swallowed the key",
  ).toBe(1);

  /* And the page is still here. `Form` prevents the native submission
     because this story sets no `action`, and a trusted key is the only way
     to find out whether that actually held — an untrusted one never starts
     the navigation there was something to prevent. */
  expect(page.url(), "the form navigated; preventDefault did not hold").toBe(
    before,
  );
  await expect(
    page.getByRole("textbox", { name: "Warehouse", exact: true }),
  ).toBeFocused();
});

/**
 * Every row of the map is exercised by a test in this file.
 *
 * Static, over this file's own source, and that is the second version.
 * The first counted rows and asserted the count had not shrunk, under a
 * comment claiming it caught a row added without a test. It could not: a
 * new row raises both the map's length and the unique-key count together,
 * so the assertion moved with the thing it was meant to constrain.
 *
 * Read from the source rather than accumulated while the tests run,
 * because `fullyParallel` is on: tests in this file are spread over
 * workers, each with its own module instance, so a set filled at runtime
 * would be missing whatever another worker did.
 */
test("every row of the map is exercised by a test in this file", () => {
  const keys = KEYBOARD_MAP.map((entry) => `${entry.component} ${entry.key}`);

  /* The informative assertion first. Checking the counts before naming
     the rows reports "expected 23, received 22", which says a row is
     missing and not which one — and the whole value of this gate is the
     name it gives you. */
  const missing = keys.filter((key) => !requested.has(key));
  expect(
    missing,
    "these rows of the keyboard map are documentation with nothing " +
      "exercising them. If a test does cover one, move its `row(...)` " +
      "lookup to module scope — a lookup inside a test body cannot be " +
      "counted here",
  ).toEqual([]);

  expect(new Set(keys).size, "the map has duplicate rows").toBe(keys.length);
});

/* --------------------------------------------------------------- Toolbar */

const TOOLBAR = ["ArrowRight", "Home", "End"] as const;

/**
 * Arrows, Home and End move within the toolbar's ring.
 *
 * Component-owned: there is no platform behaviour to preserve here, because
 * a row of buttons has none — every one of them is its own tab stop by
 * default, which is the thing this component replaces.
 *
 * Trusted keys, and for a sharper reason than usual. The handler reads
 * `document.activeElement` to decide where it is in the ring, so the test
 * has to get real focus onto a real control first; `userEvent.tab()` in a
 * story moves focus in the test library's own model and the two can
 * disagree about what is active.
 *
 * Scoped to the first toolbar in the matrix, which has five controls and no
 * disabled ones. The second toolbar exists to hold a disabled control and
 * would make "the next control" ambiguous in a test about ordering.
 *
 * `exact: true` on that name, and it is not decoration. Playwright matches
 * an accessible name as a **substring** by default, so "Table actions" also
 * matched "Table actions, with a disabled control" — the control list ran
 * across both toolbars, and `End` landed on the second one's menu trigger.
 * Two other tests in this repository have been caught by a selector that
 * matched more than it read like it did.
 */
for (const key of TOOLBAR) {
  const entry = row("Toolbar", key);
  test(`Toolbar: ${key} ${entry.expectation}`, async ({ page }) => {
    await openStory(page, entry.story);
    const toolbar = page.getByRole("toolbar", {
      name: "Table actions",
      exact: true,
    });
    const controls = toolbar.locator(
      "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    );
    const count = await controls.count();
    expect(count, "the fixture needs several controls").toBeGreaterThan(2);

    await controls.first().focus();
    await expect(controls.first()).toBeFocused();

    await page.keyboard.press(key);

    if (key === "Home") {
      await expect(
        controls.first(),
        "Home left the first control",
      ).toBeFocused();
    } else if (key === "End") {
      await expect(
        controls.nth(count - 1),
        "End did not reach the last",
      ).toBeFocused();
    } else {
      await expect(
        controls.nth(1),
        "ArrowRight did not move to the next control",
      ).toBeFocused();
    }
  });
}

/**
 * ArrowRight wraps at the end, and that is a decision rather than an
 * oversight.
 *
 * A toolbar is a closed set. Stopping at the last control means pressing
 * the other arrow as many times as there are controls to get back, which is
 * the behaviour people work around by reaching for the mouse.
 */
test("Toolbar: ArrowRight wraps from the last control to the first", async ({
  page,
}) => {
  await openStory(page, row("Toolbar", "ArrowRight").story);
  const toolbar = page.getByRole("toolbar", {
    name: "Table actions",
    exact: true,
  });
  const controls = toolbar.locator("button:not([disabled])");
  const count = await controls.count();

  await controls.nth(count - 1).focus();
  await page.keyboard.press("ArrowRight");
  await expect(controls.first(), "the ring does not wrap").toBeFocused();
});

/* -------------------------------------------------------------- TagInput */

const TAG_ENTER = row("TagInput", "Enter");
const TAG_BACKSPACE = row("TagInput", "Backspace");

/**
 * Enter commits a tag; Backspace on an empty field takes the last one back.
 *
 * Component-owned: both are this component's keydown handler, and both are
 * the behaviour every mail client already taught people. The reason they are
 * here rather than only in a story is the gate that put them in the map —
 * `TagInput` documented both keys and had no row, because the rule that
 * demands one only looked for arrows, Home, End and Escape.
 */
test(`TagInput: Enter ${TAG_ENTER.expectation}`, async ({ page }) => {
  await openStory(page, TAG_ENTER.story);
  const field = page.getByRole("textbox", { name: "Labels", exact: true });
  const tags = page.locator(".uix-taginput-tag");
  const before = await tags.count();

  await field.fill("shipping");
  await page.keyboard.press("Enter");

  await expect(tags, "Enter did not commit the draft").toHaveCount(before + 1);
  await expect(field, "the draft survived its own commit").toHaveValue("");
});

test(`TagInput: Backspace ${TAG_BACKSPACE.expectation}`, async ({ page }) => {
  await openStory(page, TAG_BACKSPACE.story);
  const field = page.getByRole("textbox", { name: "Labels", exact: true });
  const tags = page.locator(".uix-taginput-tag");
  const before = await tags.count();
  expect(before, "the fixture needs a tag to remove").toBeGreaterThan(0);

  await field.focus();
  await page.keyboard.press("Backspace");
  await expect(tags).toHaveCount(before - 1);

  /* And with a draft in the field it edits the draft instead. Both halves,
     because a component that always eats a tag is as wrong as one that
     never does. */
  await field.fill("x");
  await page.keyboard.press("Backspace");
  await expect(field).toHaveValue("");
  await expect(
    tags,
    "Backspace ate a tag while the draft was not empty",
  ).toHaveCount(before - 1);
});

/* ------------------------------------------------------------ InlineEdit */

const EDIT_ENTER = row("InlineEdit", "Enter");
const EDIT_ESCAPE = row("InlineEdit", "Escape");

/**
 * Enter commits and hands the keyboard back; Escape restores.
 *
 * Both directions, because either alone looks correct: a component that
 * commits on Escape has quietly made every accidental keystroke permanent,
 * and one that discards on Enter loses the work of anyone who expects a
 * field to behave like a field.
 *
 * The `Matrix` fixture holds three, and its labels were made distinct for
 * this — two controls both named "Edit Supplier name" would be exactly the
 * ambiguity `test/locators.spec.ts` now refuses.
 */
test(`InlineEdit: Enter ${EDIT_ENTER.expectation}`, async ({ page }) => {
  await openStory(page, EDIT_ENTER.story);
  const trigger = page.getByRole("button", {
    name: "Edit Supplier name",
    exact: true,
  });
  await trigger.click();

  const field = page.getByRole("textbox", {
    name: "Supplier name",
    exact: true,
  });
  await field.fill("Adria Components");
  await page.keyboard.press("Enter");

  await expect(field, "Enter left the editor open").toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit Supplier name", exact: true }),
    "committing left the keyboard nowhere",
  ).toBeFocused();
});

test(`InlineEdit: Escape ${EDIT_ESCAPE.expectation}`, async ({ page }) => {
  await openStory(page, EDIT_ESCAPE.story);
  const trigger = page.getByRole("button", {
    name: "Edit Supplier name",
    exact: true,
  });
  const original = ((await trigger.textContent()) ?? "").trim();
  await trigger.click();

  const field = page.getByRole("textbox", {
    name: "Supplier name",
    exact: true,
  });
  await field.fill("Something else");
  await page.keyboard.press("Escape");

  await expect(field).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit Supplier name", exact: true }),
    "Escape committed, so an abandoned edit is permanent",
  ).toHaveText(original);
});

/* ------------------------------------------------------------------ Tree */

const TREE_DOWN = row("Tree", "ArrowDown");
const TREE_RIGHT = row("Tree", "ArrowRight");
const TREE_LEFT = row("Tree", "ArrowLeft");
const TREE_END = row("Tree", "End");

/** The first tree in the matrix: collapsed, three roots, one disabled. */
const collapsedTree = (page: Page) =>
  page.getByRole("tree", { name: "Folders", exact: true });

/**
 * ArrowRight opens, then steps in. Two presses, not one.
 *
 * The pattern's own rule, and it is worth keeping: separating "open this"
 * from "go into this" is what lets somebody survey a structure without
 * losing their place in it. A single press that did both would make the
 * first ArrowRight on a branch a navigation the reader did not ask for.
 */
test(`Tree: ArrowRight ${TREE_RIGHT.expectation}`, async ({ page }) => {
  await openStory(page, TREE_RIGHT.story);
  const tree = collapsedTree(page);
  const eu = tree.getByRole("treeitem", {
    name: "European Union",
    exact: true,
  });

  await eu.focus();
  await expect(eu).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("ArrowRight");
  await expect(eu, "the first press did not open the branch").toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(
    eu,
    "the first press also moved, which is one press too many",
  ).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(
    tree.getByRole("treeitem", { name: "Textiles", exact: true }),
    "the second press did not step into the open branch",
  ).toBeFocused();
});

/**
 * ArrowLeft closes, then steps out.
 *
 * The mirror, and the half that is easy to leave out: from a leaf there is
 * nothing to close, so the key has to walk to the parent instead. Without
 * that, getting out of a deep branch means arrowing up through every one of
 * its siblings.
 */
test(`Tree: ArrowLeft ${TREE_LEFT.expectation}`, async ({ page }) => {
  await openStory(page, TREE_LEFT.story);
  const tree = collapsedTree(page);
  const eu = tree.getByRole("treeitem", {
    name: "European Union",
    exact: true,
  });

  await eu.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  const textiles = tree.getByRole("treeitem", {
    name: "Textiles",
    exact: true,
  });
  await expect(textiles).toBeFocused();

  /* Nothing to close on a closed branch, so it steps out to the parent. */
  await page.keyboard.press("ArrowLeft");
  await expect(
    eu,
    "ArrowLeft from a closed row did not walk to the parent",
  ).toBeFocused();

  /* And on the open parent it closes rather than moving. */
  await page.keyboard.press("ArrowLeft");
  await expect(eu).toHaveAttribute("aria-expanded", "false");
  await expect(eu).toBeFocused();
});

/**
 * ArrowDown crosses a branch boundary.
 *
 * The assertion that makes the flattened model worth having. From the last
 * child of an open branch, down has to land on the next root — a question
 * about the visible list and an awkward one about the tree.
 */
test(`Tree: ArrowDown ${TREE_DOWN.expectation}`, async ({ page }) => {
  await openStory(page, TREE_DOWN.story);
  const tree = collapsedTree(page);
  const eu = tree.getByRole("treeitem", {
    name: "European Union",
    exact: true,
  });

  await eu.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(
    tree.getByRole("treeitem", { name: "Textiles", exact: true }),
  ).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(
    tree.getByRole("treeitem", { name: "Packaging", exact: true }),
  ).toBeFocused();

  /* Out of the branch and on to the next root, which is the case a
     recursive walk gets wrong. */
  await page.keyboard.press("ArrowDown");
  await expect(
    tree.getByRole("treeitem", { name: "United Kingdom", exact: true }),
    "down from the last child of a branch did not reach the next root",
  ).toBeFocused();
});

/**
 * End goes to the last *visible* row, not the last node.
 *
 * With every branch closed that is the third root; the nodes inside the
 * closed branches are not somewhere a reader can be sent.
 */
test(`Tree: End ${TREE_END.expectation}`, async ({ page }) => {
  await openStory(page, TREE_END.story);
  const tree = collapsedTree(page);

  await tree
    .getByRole("treeitem", { name: "European Union", exact: true })
    .focus();
  await page.keyboard.press("End");

  await expect(
    tree.getByRole("treeitem", { name: "Switzerland", exact: true }),
    "End reached a row inside a collapsed branch, or did not move",
  ).toBeFocused();
});

/* -------------------------------------------------------- CommandPalette */

const PALETTE_DOWN = row("CommandPalette", "ArrowDown");
const PALETTE_END = row("CommandPalette", "End");

/**
 * The arrows move the highlight and leave focus in the field.
 *
 * The property that separates this from the tree and toolbar patterns, and
 * the one a naive implementation loses: moving DOM focus onto each row as
 * the arrows walk it takes focus out of the input, and the next letter typed
 * goes nowhere. So the assertion is in two halves — the highlight moved, and
 * focus did not.
 *
 * Trusted keys, because the handler reads the key from a real event on the
 * input and because "which element has focus" is exactly the kind of thing a
 * synthetic event model can be right about while the browser is not.
 */
test(`CommandPalette: ArrowDown ${PALETTE_DOWN.expectation}`, async ({
  page,
}) => {
  await openStory(page, PALETTE_DOWN.story);
  const field = page.getByRole("combobox", { name: "Commands", exact: true });
  await expect(field).toBeFocused();

  const first = await field.getAttribute("aria-activedescendant");
  expect(first, "nothing was highlighted to begin with").toBeTruthy();

  await page.keyboard.press("ArrowDown");

  const second = await field.getAttribute("aria-activedescendant");
  expect(second, "ArrowDown did not move the highlight").not.toBe(first);
  await expect(
    field,
    "the arrows moved DOM focus, so the next letter typed goes nowhere",
  ).toBeFocused();

  /* And the row that is highlighted says so, which is what a reader reads. */
  await expect(page.locator(`#${second}`)).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test(`CommandPalette: End ${PALETTE_END.expectation}`, async ({ page }) => {
  await openStory(page, PALETTE_END.story);
  const field = page.getByRole("combobox", { name: "Commands", exact: true });
  const options = page.getByRole("option");
  const count = await options.count();
  expect(count, "the fixture needs several commands").toBeGreaterThan(2);

  await page.keyboard.press("End");

  await expect(
    options.nth(count - 1),
    "End did not reach the last command",
  ).toHaveAttribute("aria-selected", "true");
  await expect(field).toBeFocused();
});

/* -------------------------------------------------------------- Combobox */

const COMBO_DOWN = row("Combobox", "ArrowDown");
const COMBO_ESCAPE = row("Combobox", "Escape");

/** The first combobox in the matrix: single-select, five options. */
const singleCombobox = (page: Page) =>
  page.getByRole("combobox", { name: "Supplier", exact: true }).first();

/**
 * ArrowDown opens, then moves the highlight, and focus never leaves.
 *
 * Two presses do two different things, which is the pattern: the first
 * opens a closed list, and the rest walk it. A single press that opened
 * *and* moved would skip the first option, which is the one a reader most
 * often wants.
 */
test(`Combobox: ArrowDown ${COMBO_DOWN.expectation}`, async ({ page }) => {
  await openStory(page, COMBO_DOWN.story);
  const field = singleCombobox(page);

  await field.focus();
  /* Focus alone opens it, so close it again to test the key from a closed
     state — which is the state the first press is about. */
  await page.keyboard.press("Escape");
  await expect(field).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("ArrowDown");
  await expect(field, "the first press did not open the list").toHaveAttribute(
    "aria-expanded",
    "true",
  );
  const first = await field.getAttribute("aria-activedescendant");

  await page.keyboard.press("ArrowDown");
  const second = await field.getAttribute("aria-activedescendant");
  expect(second, "the second press did not move the highlight").not.toBe(first);

  await expect(
    field,
    "the arrows moved DOM focus, so the next letter typed goes nowhere",
  ).toBeFocused();
});

/**
 * Escape closes the list and stops there.
 *
 * The "stops there" half matters: a combobox inside a dialog must not close
 * the dialog because somebody dismissed a list of options. What is asserted
 * here is the closing and the focus; the propagation is asserted in the
 * story, where a dialog can be put around it.
 */
test(`Combobox: Escape ${COMBO_ESCAPE.expectation}`, async ({ page }) => {
  await openStory(page, COMBO_ESCAPE.story);
  const field = singleCombobox(page);

  await field.focus();
  await expect(field).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(field, "Escape did not close the list").toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(
    field,
    "Escape closed the list and took the keyboard with it",
  ).toBeFocused();
});

/* ------------------------------------------------------------ DatePicker */

const DATE_RIGHT = row("DatePicker", "ArrowRight");
const DATE_PAGEUP = row("DatePicker", "PageUp");
const DATE_HOME = row("DatePicker", "Home");

/** The day the grid's single tab stop is on. */
const cursorDate = (page: Page) =>
  page
    .locator('.uix-datepicker-day[tabindex="0"]')
    .first()
    .getAttribute("data-date");

/**
 * ArrowRight moves a day and pages the calendar at the month's end.
 *
 * The paging is the half worth asserting. Without it, reaching the first of
 * next month means finding the paging button, which for a keyboard user is
 * leaving the grid and coming back — and the fixture starts on 31 August
 * precisely so the next press has to cross a boundary.
 */
test(`DatePicker: ArrowRight ${DATE_RIGHT.expectation}`, async ({ page }) => {
  await openStory(page, DATE_RIGHT.story);
  expect(await cursorDate(page)).toBe("2026-08-31");
  await page.keyboard.press("ArrowRight");
  expect(
    await cursorDate(page),
    "the cursor did not cross into the next month",
  ).toBe("2026-09-01");

  /* And the grid now says September, which is what a reader is told. */
  await expect(page.getByRole("grid")).toHaveAttribute(
    "aria-label",
    /September/,
  );
});

/**
 * PageUp moves back a month and clamps the day.
 *
 * 31 October back a month is 30 September, not the 31st of a month that has
 * none. Leap years make the alternative — a table of month lengths — a thing
 * somebody has to maintain.
 */
test(`DatePicker: PageUp ${DATE_PAGEUP.expectation}`, async ({ page }) => {
  await openStory(page, DATE_PAGEUP.story);
  /* From 31 August, one month forward has to clamp: September has 30 days. */
  await page.keyboard.press("PageDown");
  expect(await cursorDate(page), "September was given a 31st day").toBe(
    "2026-09-30",
  );

  /* And the clamp is sticky — the 30th of October, not a remembered 31st.
     That is the decision rather than an accident: restoring the day somebody
     originally wanted is hidden state, and it would mean PageDown twice then
     PageUp twice does not return you to where you started. This test first
     asserted the other behaviour, because I assumed it without reading the
     arithmetic I had written. Pinned so a later "improvement" has to argue
     with it. */
  await page.keyboard.press("PageDown");
  expect(await cursorDate(page)).toBe("2026-10-30");

  await page.keyboard.press("PageUp");
  expect(await cursorDate(page)).toBe("2026-09-30");
});

/**
 * Home goes to the first day of the week, which the locale decides.
 *
 * The fixture is `de-DE`, so the week starts on Monday: 31 August 2026 is
 * itself a Monday, and the day after it goes back to it. A component that
 * hardcoded Sunday would land a day earlier and be wrong in half the world.
 */
test(`DatePicker: Home ${DATE_HOME.expectation}`, async ({ page }) => {
  await openStory(page, DATE_HOME.story);
  await page.keyboard.press("ArrowRight");
  expect(await cursorDate(page)).toBe("2026-09-01");

  await page.keyboard.press("Home");
  expect(
    await cursorDate(page),
    "Home did not use the locale's own first day of the week",
  ).toBe("2026-08-31");
});
