/**
 * Mixed-direction content, laid out by its own direction.
 *
 * Under `dir="rtl"` every caller-supplied slot was being laid out as an
 * RTL paragraph, whatever the text in it actually was. Two visible
 * results, both found by rendering the RTL axis and looking at it:
 *
 *   - A character counter of "0 / 40" rendered "40 / 0". The digits are
 *     LTR runs and an RTL paragraph places them right to left, so the
 *     field said none of forty instead of none out of forty.
 *   - Every English hint moved its full stop to the far left:
 *     ".One line of guidance".
 *
 * The fix is `unicode-bidi: plaintext`, which runs the first-strong rule
 * over the content instead of inheriting the page direction. `isolate`
 * would not have done it: isolation stops a run from reordering its
 * neighbours and leaves the base direction inherited.
 *
 * These assert the rendered order rather than the declaration. The
 * declaration was the fix; the order is the property, and only one of the
 * two would survive someone switching to a different mechanism.
 */
import { test, expect, type Page } from "@playwright/test";

/** The x midpoint of the first occurrence of `needle` inside `selector`. */
async function xOf(page: Page, selector: string, needle: string) {
  return page.evaluate(
    ({ selector, needle }) => {
      const host = document.querySelector(selector);
      if (!host) return null;
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent ?? "";
        const at = text.indexOf(needle);
        if (at === -1) continue;
        const range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + needle.length);
        const box = range.getBoundingClientRect();
        return box.left + box.width / 2;
      }
      return null;
    },
    { selector, needle },
  );
}

async function field(page: Page, direction: "ltr" | "rtl") {
  await page.goto(
    `/iframe.html?id=components-field--matrix&viewMode=story&globals=direction:${direction}`,
    { waitUntil: "domcontentloaded" },
  );
  await page.locator(".uix-field-aside").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

test("a numeric counter keeps its order under RTL", async ({ page }) => {
  await field(page, "rtl");
  const current = await xOf(page, ".uix-field-aside", "0");
  const total = await xOf(page, ".uix-field-aside", "40");
  expect(current, "no counter found").not.toBeNull();
  expect(total).not.toBeNull();
  expect(
    current!,
    `the counter rendered its total (${total}) left of its current value ` +
      `(${current}), which reads as "40 / 0" — the slot is inheriting the ` +
      `page direction instead of asking its own content`,
  ).toBeLessThan(total!);
});

test("an English hint keeps its full stop at the end under RTL", async ({
  page,
}) => {
  await field(page, "rtl");
  const word = await xOf(page, ".uix-field-hint", "guidance");
  const stop = await xOf(page, ".uix-field-hint", ".");
  expect(word, "no hint found").not.toBeNull();

  /* The full stop, not the last word. The first version of this compared
     "One" with "guidance." and passed without the fix — the words of an
     all-LTR sentence keep their order inside an RTL paragraph, and only
     the trailing neutral character moves. It asserted something that was
     never broken. The period is the character the bidi algorithm
     actually relocates, so it is the one to measure. */
  expect(
    stop!,
    `the hint's full stop rendered at x=${stop}, left of the word before it ` +
      `at x=${word} — the page direction moved the sentence's punctuation ` +
      `to the far side, giving ".One line of guidance"`,
  ).toBeGreaterThan(word!);
});

test("the interface still mirrors, so the text sits on the right", async ({
  page,
}) => {
  // The half that must NOT change. Content decides its own reading
  // direction; the interface decides which edge it starts from. A fix
  // that reached for `direction: ltr` would pass the two tests above and
  // break this one, by pinning Arabic content to the left margin of an
  // Arabic page.
  await field(page, "rtl");
  const viewport = page.viewportSize()!.width;
  const hint = await page.locator(".uix-field-hint").first().boundingBox();
  expect(
    hint!.x + hint!.width,
    "the hint is not aligned to the inline start of an RTL page",
  ).toBeGreaterThan(viewport / 2);
});
