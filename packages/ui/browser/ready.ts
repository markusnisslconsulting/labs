import type { Page } from "@playwright/test";

/**
 * Navigate to a story and wait for the design system to be in force.
 *
 * Every spec in this suite used to do this with `waitUntil: "networkidle"`,
 * which is a heuristic about the network standing in for a fact about the
 * page. Storybook injects its stylesheets from JavaScript, so the network
 * can go quiet before a single custom property has been declared — and a
 * test that measures `var(--uix-control-md)` before then does not fail
 * loudly. It reads an invalid `height`, gets `auto`, and measures 0.
 *
 * That is what it did. In CI, on one of thirteen call sites, the density
 * test reported "the coaching brand renders the default control height
 * (0px)" and blamed the brand. Both probes were 0; nothing about density
 * was wrong. The other twelve call sites are the same race, waiting for a
 * slower machine.
 *
 * So this waits for the token layer to resolve, which is the thing every
 * one of those tests actually depends on. `--uix-control-md` is the
 * sentinel because it is derived from the density multiplier: if it has a
 * value, primitive, semantic and the density roles have all landed.
 */
/**
 * Which root attribute each toolbar global ends up as.
 *
 * The decorators in .storybook/preview.tsx stamp these in an effect, so
 * they land *after* the first render commit. Asking for
 * `globals=theme:dark` and measuring as soon as the story appears reads
 * the light theme: measured, `data-theme` was still null at that moment
 * and `dark` 600ms later. Three theme tests failed that way and all three
 * blamed `color-scheme`.
 */
const GLOBAL_ATTRIBUTES: Record<string, string> = {
  theme: "data-theme",
  direction: "dir",
  brand: "data-brand",
  density: "data-density",
};

export async function openStory(
  page: Page,
  id: string,
  options: { globals?: string; fonts?: boolean } = {},
) {
  const requested = (options.globals ?? "")
    .split(";")
    .filter(Boolean)
    .map((pair) => pair.split(":"))
    .flatMap(([name, value]) =>
      name && value && GLOBAL_ATTRIBUTES[name]
        ? [[GLOBAL_ATTRIBUTES[name]!, value] as const]
        : [],
    );

  const globals = options.globals ? `&globals=${options.globals}` : "";
  await page.goto(`/iframe.html?id=${id}&viewMode=story${globals}`, {
    waitUntil: "domcontentloaded",
  });
  /* Two conditions, and the first draft of this had only the second.
   *
   * Waiting for #storybook-root to be *attached* is not waiting for the
   * story to have rendered: Storybook puts the element in the document
   * before React mounts anything into it. Three forced-colors tests
   * started failing with "Received: null" — they were querying for a tab
   * and a button in an empty root. `networkidle` had happened to cover
   * this by accident, which is the whole problem with a heuristic: you
   * cannot tell which of the things it waits for you were relying on.
   *
   * So: the root has a child, and the token layer resolves. */
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#storybook-root");
      if (!root || root.children.length === 0) return false;
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--uix-control-md")
          .trim().length > 0
      );
    },
    undefined,
    { timeout: 30_000 },
  );
  /* And the globals this call asked for have actually been stamped. */
  if (requested.length) {
    await page.waitForFunction(
      (pairs) =>
        pairs.every(
          ([attribute, value]) =>
            document.documentElement.getAttribute(attribute) === value,
        ),
      requested.map(([a, v]) => [a, v] as [string, string]),
      { timeout: 30_000 },
    );
  }
  if (options.fonts !== false) {
    await page.evaluate(() => document.fonts.ready);
  }
  return page;
}
