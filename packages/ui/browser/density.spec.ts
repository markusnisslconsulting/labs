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

test("a brand can set the density, and it reaches the controls", async ({
  page,
}) => {
  // --uix-density is a semantic token, so a brand is allowed to set it, and
  // the coaching brand does: room is part of what distinguishes it from the
  // consulting one. This works only because the density-derived roles are
  // declared on [data-brand] as well as on :root. Without that the
  // declaration would sit on the brand element while the heights stayed
  // resolved against the root, and the brand would look identical — the
  // same failure as subtree density, one attribute over.
  await page.goto("/iframe.html?id=components-button--matrix&viewMode=story", {
    waitUntil: "networkidle",
  });

  const measured = await page.evaluate(async () => {
    const make = (brand?: string) => {
      const host = document.createElement("div");
      if (brand) host.setAttribute("data-brand", brand);
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;height:var(--uix-control-md);width:var(--uix-gap-xl)";
      host.appendChild(probe);
      document.body.appendChild(host);
      return { host, probe };
    };
    const base = make();
    const coaching = make("coaching");
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const read = (el: Element) => {
      const box = el.getBoundingClientRect();
      return { height: box.height, gap: box.width };
    };
    const result = { base: read(base.probe), coaching: read(coaching.probe) };
    base.host.remove();
    coaching.host.remove();
    return result;
  });

  expect(
    measured.coaching.height,
    `the coaching brand renders the default control height ` +
      `(${measured.coaching.height}px); the density-derived roles are probably ` +
      `no longer declared on [data-brand]`,
  ).toBeGreaterThan(measured.base.height);
  expect(measured.coaching.gap).toBeGreaterThan(measured.base.gap);
});

test("a brand's typography reaches prose and leaves the controls alone", async ({
  page,
}) => {
  // The third appearance of one trap, and the reason this test exists.
  // font-family and line-height are inherited properties: declared on
  // body, every descendant inherits the value computed there, so a brand
  // re-pointing --uix-font-body on a subtree changed a custom property
  // nobody read again. The coaching brand rendered in the consulting
  // typeface and looked plausible.
  //
  // It used to read this off a side-by-side story, which was two things
  // at once: a page showing the brands next to each other, and this
  // test's only fixture. Storybook's toolbar already switches brands, so
  // the page went — and the test built its own probes instead, the way
  // the density test above does. A test that owns its fixture cannot be
  // broken by a decision about the catalogue.
  await page.goto("/iframe.html?id=components-button--matrix&viewMode=story", {
    waitUntil: "networkidle",
  });

  const measured = await page.evaluate(async () => {
    const make = (brand?: string) => {
      const host = document.createElement("div");
      if (brand) host.setAttribute("data-brand", brand);
      const prose = document.createElement("p");
      prose.textContent = "Prose in the brand's own voice.";
      const control = document.createElement("button");
      control.className = "uix-button";
      control.textContent = "Book a conversation";
      host.append(prose, control);
      document.body.appendChild(host);
      return { host, prose, control };
    };
    const base = make();
    const coaching = make("coaching");
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const read = ({ prose, control }: { prose: Element; control: Element }) => {
      const p = getComputedStyle(prose);
      return {
        proseFace: p.fontFamily,
        proseLeading: parseFloat(p.lineHeight),
        controlFace: getComputedStyle(control).fontFamily,
      };
    };
    const result = { base: read(base), coaching: read(coaching) };
    base.host.remove();
    coaching.host.remove();
    return result;
  });

  expect(
    measured.coaching.proseFace,
    "the coaching brand's prose renders in the consulting typeface",
  ).not.toBe(measured.base.proseFace);
  expect(measured.coaching.proseFace).toMatch(/Charter|Iowan|Hoefler|Georgia/);
  expect(
    measured.coaching.proseLeading,
    "the brand's looser leading did not apply",
  ).toBeGreaterThan(measured.base.proseLeading);
  // And the half that must NOT change: an interface face stays an
  // interface face, because legibility beats identity on a control.
  expect(
    measured.coaching.controlFace,
    "the brand's prose face leaked onto a control",
  ).toBe(measured.base.controlFace);
});
