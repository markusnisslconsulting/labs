/**
 * A high contrast theme must not erase what a state means.
 *
 * Windows contrast themes (and `forced-colors: active` generally) replace
 * every colour the page chose and drop `box-shadow` entirely. Anything
 * that said "this one is selected" with a background, or "this floats
 * above the page" with a shadow, then says nothing at all. The library
 * had nine such places and no test could see them, because the whole
 * suite ran in the default mode.
 *
 * Every case asserts a *difference*, never a particular colour: the user
 * picked the palette and we do not get to check it. Selected must differ
 * from unselected; a floating surface must have an edge.
 *
 * The first version of this file was worthless and said so only because
 * of the sanity test below. `test.use({ forcedColors })` did not reach
 * the page, so four checks passed comparing a selected control to an
 * unselected one — which differ in the ordinary mode too. emulateMedia
 * is used instead because it was verified to work.
 */
import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
});

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`, {
    waitUntil: "networkidle",
  });
}

/**
 * Storybook injects buttons of its own into the preview iframe — three
 * "Set string" controls sit outside the story — so a bare
 * locator("button") clicks the harness rather than the component.
 */
const STORY = "#storybook-root";

test("forced colours are actually in force", async ({ page }) => {
  await open(page, "components-chip--matrix");
  const active = await page.evaluate(
    () => matchMedia("(forced-colors: active)").matches,
  );
  expect(
    active,
    "the browser is not emulating forced colours, so every other check in this file is meaningless",
  ).toBe(true);
});

test("a selected chip differs from an unselected one", async ({ page }) => {
  await open(page, "components-chip--matrix");
  const pair = await page.evaluate(() => {
    const chips = [...document.querySelectorAll("button.uix-chip")];
    const read = (pressed: string) => {
      const el = chips.find((c) => c.getAttribute("aria-pressed") === pressed);
      if (!el) return null;
      const s = getComputedStyle(el);
      return `${s.backgroundColor}/${s.color}`;
    };
    return { on: read("true"), off: read("false") };
  });
  expect(pair.on, "the matrix renders no pressed chip").not.toBeNull();
  expect(pair.off, "the matrix renders no unpressed chip").not.toBeNull();
  expect(
    pair.on,
    "a pressed and an unpressed chip render identically under forced colours",
  ).not.toBe(pair.off);
});

test("a selected segment differs from an unselected one", async ({ page }) => {
  await open(page, "components-segmentedcontrol--matrix");
  const pair = await page.evaluate(() => {
    const segments = [...document.querySelectorAll(".uix-segment")];
    const read = (pressed: string) => {
      const el = segments.find(
        (s) => s.getAttribute("aria-pressed") === pressed,
      );
      return el ? getComputedStyle(el).backgroundColor : null;
    };
    return { on: read("true"), off: read("false") };
  });
  expect(pair.on).not.toBeNull();
  expect(
    pair.on,
    "the selected segment is indistinguishable under forced colours",
  ).not.toBe(pair.off);
});

test("an on switch differs from an off switch", async ({ page }) => {
  await open(page, "components-switch--matrix");
  const pair = await page.evaluate(() => {
    const all = [...document.querySelectorAll(".uix-switch")];
    const read = (checked: boolean) => {
      const el = all.find((s) => s.hasAttribute("data-checked") === checked);
      return el ? getComputedStyle(el).backgroundColor : null;
    };
    return { on: read(true), off: read(false) };
  });
  expect(pair.on).not.toBeNull();
  expect(pair.off).not.toBeNull();
  expect(
    pair.on,
    "an on and an off switch render the same track under forced colours",
  ).not.toBe(pair.off);
});

test("the active tab is still marked", async ({ page }) => {
  await open(page, "components-tabs--matrix");
  const pair = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll(".uix-tab")];
    const read = (active: boolean) => {
      const el = tabs.find((t) => t.hasAttribute("data-active") === active);
      if (!el) return null;
      const s = getComputedStyle(el);
      return `${s.borderBottomColor} ${s.borderBottomWidth}`;
    };
    return { active: read(true), rest: read(false) };
  });
  expect(pair.active).not.toBeNull();
  expect(
    pair.active,
    "the active tab's underline is indistinguishable under forced colours",
  ).not.toBe(pair.rest);
});

const FLOATING = [
  { id: "components-popover--open", selector: ".uix-popover", open: false },
  { id: "components-menu--open", selector: ".uix-menu", open: false },
  /* Was components-dialog--modal, whose dialog only existed after its
     play function clicked the trigger — so this measured a closed dialog
     the moment the play function moved into its own story. A fixture that
     is open from the first frame cannot go ambiguous that way. */
  {
    id: "components-dialog--open-with-page-behind",
    selector: ".uix-dialog",
    open: false,
  },
];

for (const { id, selector, open: needsOpening } of FLOATING) {
  test(`${selector} has an edge without its shadow`, async ({ page }) => {
    await open(page, id);
    if (needsOpening) {
      // These are portalled and exist only while open.
      await page.locator(`${STORY} button`).first().click();
    }
    const popup = page.locator(selector).first();
    await expect(popup).toBeVisible();
    const width = await popup.evaluate(
      (el) => parseFloat(getComputedStyle(el).borderTopWidth) || 0,
    );
    expect(
      width,
      `${selector} relies on a shadow that forced colours does not paint, ` +
        `and has no border to fall back on`,
    ).toBeGreaterThan(0);
  });
}

test("a disabled button reads as disabled", async ({ page }) => {
  await open(page, "components-button--matrix");
  const pair = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button.uix-button")];
    const read = (disabled: boolean) => {
      const el = buttons.find(
        (b) => (b as HTMLButtonElement).disabled === disabled,
      );
      return el ? getComputedStyle(el).color : null;
    };
    return { disabled: read(true), enabled: read(false) };
  });
  expect(pair.disabled).not.toBeNull();
  expect(pair.enabled).not.toBeNull();
  expect(
    pair.disabled,
    "a disabled button takes the same text colour as an enabled one; " +
      "opacity alone is not a disabled state here",
  ).not.toBe(pair.enabled);
});
