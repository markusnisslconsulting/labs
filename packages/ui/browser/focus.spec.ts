/**
 * Focus goes somewhere sensible, and comes back.
 *
 * Nothing here checked it. Every overlay in the library — dialog, popover,
 * menu — takes focus when it opens, and the requirement people forget is
 * the return trip: close it and focus has to land back on the control
 * that opened it. Lose that and a keyboard user is dropped at the top of
 * the document, which on a long page means finding their place again
 * every single time.
 *
 * Base UI implements it. That is a reason to expect it to work, not a
 * reason to leave it unasserted: the wiring is ours to get wrong — a
 * trigger rendered through `render`, a portal in the wrong place, a
 * remount on close — and none of those would fail anything else.
 */
import { test, expect, type Page } from "@playwright/test";
import { openStory } from "./ready";

const STORY = "#storybook-root";

async function open(page: Page, id: string) {
  await openStory(page, id);
}

const OVERLAYS = [
  { id: "components-popover--details", popup: ".uix-popover" },
  { id: "components-menu--row-actions", popup: ".uix-menu" },
];

for (const { id, popup } of OVERLAYS) {
  test(`${popup} returns focus to its trigger`, async ({ page }) => {
    await open(page, id);
    const trigger = page.locator(`${STORY} button`).first();
    await trigger.focus();
    await trigger.press("Enter");
    await expect(page.locator(popup)).toBeVisible();

    // Focus moved into the overlay, which is the first half.
    const inside = await page.evaluate(
      (selector) =>
        document.querySelector(selector)?.contains(document.activeElement) ??
        false,
      popup,
    );
    expect(inside, `focus did not move into ${popup} on open`).toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.locator(popup)).toBeHidden();

    // And the return trip.
    const returned = await trigger.evaluate(
      (el) => el === document.activeElement,
    );
    expect(
      returned,
      `focus did not return to the trigger after ${popup} closed; a keyboard ` +
        `user is now at the top of the document`,
    ).toBe(true);
  });
}

test("a dialog does not let focus reach the page behind it", async ({
  page,
}) => {
  await open(page, "components-dialog--open-with-page-behind");
  const dialog = page.locator(".uix-dialog");
  await expect(dialog).toBeVisible();

  /*
   * The requirement, stated precisely.
   *
   * A first version asserted that focus is inside the dialog after every
   * single Tab, and that is not what a focus trap does: Base UI places
   * guard elements either side of the popup, so focus legitimately rests
   * on a guard — and briefly on the body — for one tick while it is
   * bounced back. Asserting the mechanism instead of the guarantee made
   * the test fail on a working trap.
   *
   * What must never happen is focus reaching something the user can
   * operate behind the modal. The trigger is the nearest such thing and
   * the easiest to name.
   */
  const escaped: string[] = [];
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press("Tab");
    const reached = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;
      const popup = document.querySelector(".uix-dialog");
      if (popup?.contains(active)) return null;
      /*
       * Two things outside the popup are not the page behind it.
       *
       * A focus guard is Base UI's own sentinel: a 1x1 aria-hidden span
       * that exists to catch focus and bounce it back, and it says so in
       * an attribute. Filtering on size alone missed it, because 1x1 is
       * not 0x0 — so the test reported a working trap as broken for four
       * rounds while the real escape (the button behind) was fixed.
       *
       * The body receiving focus is the transient state between one
       * bounce and the next.
       */
      if (active.hasAttribute("data-base-ui-focus-guard")) return null;
      if (active === document.body) return null;
      return `${active.tagName.toLowerCase()}.${active.className}`;
    });
    if (reached) escaped.push(`tab ${i + 1}: ${reached}`);
  }

  expect(
    escaped,
    `focus reached an operable element behind the modal:\n  ${escaped.join("\n  ")}`,
  ).toEqual([]);
});
