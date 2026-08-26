/**
 * Nothing may overflow a phone.
 *
 * Reported as "pagination is breaking on narrow", and measuring it at
 * 360px showed the row wrapping with the Next button alone on a second
 * line. Chromatic photographs a narrow mode, so a human would eventually
 * have seen it in a diff; this fails the build before the bill.
 *
 * Two properties per story, both about the box rather than the pixels:
 * the container never scrolls sideways, and a control that reads as one
 * row stays one row.
 */
import { test, expect } from "@playwright/test";

const NARROW = 360;

/** Stories that must survive a phone, with the row that must not wrap. */
const CASES = [
  { id: "components-pagination--nine-pages", row: ".uix-pagination" },
  { id: "components-tabs--matrix", row: null },
  { id: "components-segmentedcontrol--matrix", row: null },
  { id: "components-numberfield--matrix", row: ".uix-numberfield" },
  { id: "components-searchinput--matrix", row: null },
  { id: "components-breadcrumb--trail", row: null },
  { id: "components-table--ordering-desk", row: null },
];

for (const { id, row } of CASES) {
  test(`${id} fits ${NARROW}px`, async ({ page }) => {
    await page.setViewportSize({ width: NARROW, height: 900 });
    await page.goto(`/iframe.html?id=${id}&viewMode=story`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("#storybook-root");
    await expect(root).toBeVisible();

    // The document, not the element: an element may scroll inside its own
    // overflow container on purpose, but the page must never.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(
      overflow,
      `${id} overflows the viewport by ${overflow}px`,
    ).toBeLessThanOrEqual(0);

    if (!row) return;
    // "Did it wrap" is a question about height, not about top offsets. The
    // first version of this compared each child's top and reported two
    // rows for a correctly laid out pagination, because a centred flex
    // row puts a short child and a tall one at different tops on purpose.
    const measured = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const visible = [...el.children].filter(
        (child) => getComputedStyle(child).display !== "none",
      );
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const padding =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const tallest = Math.max(
        ...visible.map((child) => child.getBoundingClientRect().height),
      );
      return {
        content: box.height - padding,
        tallest,
        count: visible.length,
      };
    }, row);
    expect(measured, `${row} was not found in ${id}`).not.toBeNull();
    expect(measured!.count, `${row} rendered nothing`).toBeGreaterThan(0);
    expect(
      measured!.content,
      `${row} is ${Math.round(measured!.content)}px tall for a tallest child of ` +
        `${Math.round(measured!.tallest)}px, so it wrapped at ${NARROW}px`,
    ).toBeLessThanOrEqual(measured!.tallest + 2);
  });
}
