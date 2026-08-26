/**
 * Density composes, and a subtree can be denser than its page.
 *
 * This is the behaviour that registering the derived tokens with
 * @property would have quietly removed. A registered property resolves
 * at computed-value time, so --uix-control-md declared on :root would
 * inherit as an absolute pixel value and a compact subtree — which
 * re-declares only --uix-density — would keep the root's heights.
 * Unregistered, the calc() is substituted where it is used, so the
 * subtree's own multiplier applies. Nothing about that is visible in a
 * stylesheet review, which is why it is a test.
 *
 * It also pins the floor: compact must not take a control under the WCAG
 * 2.2 target size, whatever multiplier a product picks.
 */
import { test, expect } from "@playwright/test";

test("a compact subtree is denser than its cozy page", async ({ page }) => {
  await page.goto("/iframe.html?id=components-button--matrix&viewMode=story", {
    waitUntil: "networkidle",
  });

  const measured = await page.evaluate(async () => {
    const root = document.documentElement;
    root.setAttribute("data-density", "cozy");

    // A probe inside a compact subtree, and one outside it, so the
    // comparison is between two live elements on the same page rather
    // than between two page loads.
    const outer = document.createElement("div");
    const subtree = document.createElement("div");
    subtree.setAttribute("data-density", "compact");
    const make = (parent: Element) => {
      const box = document.createElement("div");
      box.style.cssText =
        "position:absolute;visibility:hidden;height:var(--uix-control-md);width:var(--uix-gap-xl)";
      parent.appendChild(box);
      return box;
    };
    document.body.append(outer, subtree);
    const cozy = make(outer);
    const compact = make(subtree);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const read = (el: Element) => {
      const box = el.getBoundingClientRect();
      return { height: box.height, gap: box.width };
    };
    const result = { cozy: read(cozy), compact: read(compact) };
    outer.remove();
    subtree.remove();
    return result;
  });

  expect(
    measured.compact.height,
    `a compact subtree kept the page's control height (${measured.compact.height}px); ` +
      `the derived tokens have probably been registered with @property`,
  ).toBeLessThan(measured.cozy.height);
  expect(
    measured.compact.gap,
    "a compact subtree kept the page's gap",
  ).toBeLessThan(measured.cozy.gap);
  // The floor holds inside the subtree too.
  expect(
    measured.compact.height,
    "compact took a control under the WCAG 2.2 target size",
  ).toBeGreaterThanOrEqual(24);
});

test("an invalid density falls back instead of poisoning the page", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-button--matrix&viewMode=story", {
    waitUntil: "networkidle",
  });
  const height = await page.evaluate(async () => {
    const root = document.documentElement;
    // Not a number. Unregistered, this would substitute into every calc()
    // and make each one invalid at computed-value time.
    root.style.setProperty("--uix-density", "medium");
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;visibility:hidden;height:var(--uix-control-md)";
    root.appendChild(probe);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const measured = probe.getBoundingClientRect().height;
    probe.remove();
    root.style.removeProperty("--uix-density");
    return measured;
  });
  expect(
    height,
    "an invalid density should fall back to 1, leaving the md control at its 40px default",
  ).toBe(40);
});
