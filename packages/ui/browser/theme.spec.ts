/**
 * The theme axis has three positions, and the third one is the system's.
 *
 * Every theme-dependent role is a single `light-dark()` declaration, and
 * `light-dark()` reads the used `color-scheme`. That is the whole switch:
 * `data-theme="dark"` sets `only dark`, `data-theme="auto"` sets
 * `light dark`, and the browser's own preference decides. There is no
 * second block of declarations to keep in step, which is what made a
 * follow-the-system option possible at all.
 *
 * Which also means `color-scheme` is load-bearing, not cosmetic. If a
 * refactor drops it, the page does not lose a scrollbar colour — it picks
 * the wrong half of twenty declarations and keeps rendering.
 */
import { test, expect, type Page } from "@playwright/test";
import { openStory } from "./ready";

/**
 * The page colours under a given theme, measured on a subtree.
 *
 * This used to set `data-theme` on `document.documentElement` and measure
 * there. That is the attribute Storybook's own `withThemeByDataAttribute`
 * decorator owns and rewrites from the toolbar globals, so the test and
 * the decorator were both writing the same attribute — and whichever ran
 * last decided the result. It held while the suite waited on
 * `networkidle`, which gave the decorator time to settle first, and broke
 * the moment the wait became precise: in CI the dark reading came back as
 * the light page colour and the failure blamed `color-scheme`.
 *
 * A subtree is the honest fixture. `[data-theme]` is not root-scoped —
 * the rules match any element — and `light-dark()` resolves against the
 * used `color-scheme` of the element that reads it, which is the whole
 * mechanism this file exists to check. So a themed `<div>` inside the
 * story tests the same contract, tests it somewhere the decorator has no
 * claim, and additionally proves the thing a product actually needs: a
 * dark panel on a light page.
 */
/**
 * The page colours under a theme, driven through Storybook's globals.
 *
 * Two earlier shapes of this were wrong in instructive ways.
 *
 * It first set `data-theme` on `document.documentElement`. That is the
 * attribute Storybook's `withThemeByDataAttribute` decorator owns and
 * rewrites from the toolbar globals, so the test and the decorator both
 * wrote it and whichever ran last decided. It held while the suite waited
 * on `networkidle` — which gave the decorator time to settle first — and
 * broke the moment the wait became precise.
 *
 * The fix attempt was to measure on a themed subtree instead, which read
 * as the honest fixture and was simply not supported: light-dark() inside
 * a custom property resolves against the element where the property is
 * declared, and every theme role is declared on :root. That is now
 * written down in semantic.css and pinned by the last test in this file.
 *
 * So the theme comes from the globals, which is the path the toolbar and
 * a product both use, and nothing here writes an attribute anyone else
 * owns.
 */
async function pageColours(page: Page, theme?: string) {
  await openStory(page, "components-button--matrix", {
    globals: theme ? `theme:${theme}` : undefined,
  });
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;visibility:hidden;background:var(--uix-bg-page);color:var(--uix-text-primary)";
    document.body.appendChild(probe);
    const s = getComputedStyle(probe);
    const out = { background: s.backgroundColor, text: s.color };
    probe.remove();
    return out;
  });
}

async function story(page: Page) {
  await openStory(page, "components-button--matrix");
}

test("light and dark are distinct, and the default is light", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  const fallback = await pageColours(page);
  const light = await pageColours(page, "light");
  const dark = await pageColours(page, "dark");

  expect(fallback, "the default global must render the light theme").toEqual(
    light,
  );
  expect(
    dark.background,
    "the dark theme renders the light page colour; color-scheme is probably gone",
  ).not.toBe(light.background);
  expect(dark.text).not.toBe(light.text);
});

test("auto follows the system in both directions", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  const autoLight = await pageColours(page, "auto");
  const light = await pageColours(page, "light");

  await page.emulateMedia({ colorScheme: "dark" });
  const autoDark = await pageColours(page, "auto");
  const dark = await pageColours(page, "dark");

  expect(
    autoLight.background,
    "auto did not follow a light system preference",
  ).toBe(light.background);
  expect(
    autoDark.background,
    "auto did not follow a dark system preference",
  ).toBe(dark.background);
});

test("an explicit theme overrides the system preference", async ({ page }) => {
  // The reason the token layer uses `only light` rather than `light`: a
  // bare value lets a user-agent in forced-dark mode flip it anyway.
  await page.emulateMedia({ colorScheme: "dark" });
  const forcedLight = await pageColours(page, "light");
  await page.emulateMedia({ colorScheme: "light" });
  const plainLight = await pageColours(page, "light");
  expect(
    forcedLight.background,
    "data-theme=light gave way to a dark system preference",
  ).toBe(plainLight.background);
});

test("a brand's accent flips with the theme without a theme selector", async ({
  page,
}) => {
  // A brand used to need two extra selectors for this, and the compound
  // one alone never matched a nested brand. One light-dark() replaced both.
  /* The theme goes on an outer host, not on documentElement: that
     attribute belongs to Storybook's theme decorator, and both writing it
     made the result depend on which ran last. Nesting says the same thing
     — a brand inside a themed ancestor — and says it somewhere nothing
     else is writing. */
  /* The theme comes from the globals so it lands on the root, where it
     works; the brand is nested under it, which is the case that used to
     need a compound selector and never matched. */
  const read = async (theme: string) => {
    await openStory(page, "components-button--matrix", {
      globals: `theme:${theme}`,
    });
    return page.evaluate(() => {
      const brand = document.createElement("div");
      brand.setAttribute("data-brand", "coaching");
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;color:var(--uix-accent)";
      brand.appendChild(probe);
      document.body.appendChild(brand);
      const colour = getComputedStyle(probe).color;
      brand.remove();
      return colour;
    });
  };
  const light = await read("light");
  const dark = await read("dark");
  expect(
    dark,
    "a nested coaching brand kept its light accent under a dark root",
  ).not.toBe(light);
});

/**
 * A role named for a relationship has to hold that relationship.
 *
 * `--uix-bg-raised` claims to be lighter than the surface behind it in
 * both themes. That is a claim about two colours, so a name cannot
 * satisfy it and a stylesheet parser cannot check it — `light-dark()`
 * reads the used `color-scheme`, which only a browser knows.
 *
 * The claim exists because its absence shipped twice. `--uix-bg-surface`
 * is the lightest of the three surface roles on light and not on dark, so
 * a chip filled with it on a `subtle` track rose on one theme and sank on
 * the other: the selected segment of a SegmentedControl, and the thumb of
 * a Switch. In the dark theme the switch's knob was darker than its own
 * track and all but vanished, while the disabled knob — a light grey —
 * was more visible than the enabled one.
 */
test("a raised surface is lighter than the one behind it, in both themes", async ({
  page,
}) => {
  const read = async (theme: "light" | "dark") => {
    await openStory(page, "components-button--matrix", {
      globals: `theme:${theme}`,
    });
    return page.evaluate(() => {
      const luminance = (colour: string) => {
        const [r, g, b] = (colour.match(/[\d.]+/g) ?? [])
          .slice(0, 3)
          .map(Number);
        const linear = [r!, g!, b!].map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
      };
      const probe = document.createElement("div");
      document.body.appendChild(probe);
      const of = (token: string) => {
        probe.style.background = `var(${token})`;
        return luminance(getComputedStyle(probe).backgroundColor);
      };
      const out = {
        raised: of("--uix-bg-raised"),
        subtle: of("--uix-bg-subtle"),
        surface: of("--uix-bg-surface"),
      };
      probe.remove();
      return out;
    });
  };

  const measured = { light: await read("light"), dark: await read("dark") };

  for (const theme of ["light", "dark"] as const) {
    const { raised, subtle } = measured[theme];
    expect(
      raised,
      `in ${theme}, --uix-bg-raised (luminance ${raised.toFixed(3)}) is not ` +
        `lighter than --uix-bg-subtle (${subtle.toFixed(3)}), so anything ` +
        `filled with it sinks into its own track`,
    ).toBeGreaterThan(subtle);
  }

  /* And the inversion this role was added to fix, recorded as the reason:
     --uix-bg-surface satisfies the same comparison on light and fails it
     on dark. If that ever stops being true the role may be redundant, and
     this assertion is what would say so. */
  expect(measured.light.surface).toBeGreaterThan(measured.light.subtle);
  expect(measured.dark.surface).toBeLessThan(measured.dark.subtle);
});

/**
 * Theming is a root-level switch, and this pins that.
 *
 * `[data-theme]` used to match any element, which made a dark panel on a
 * light page look supported. Measured in Chromium: inside a nested
 * `[data-theme="dark"]`, `color-scheme` inherits to the subtree and a
 * `light-dark()` written locally resolves dark — but `var(--uix-bg-page)`
 * comes back rgb(247,249,252). `light-dark()` inside a custom property
 * resolves against the color-scheme of the element where the property is
 * *declared*, and every theme-dependent role is declared once on `:root`.
 *
 * A nested attribute therefore turned the scrollbars, the caret and every
 * native control in that subtree dark while all forty tokens stayed
 * light. The rules are scoped to `:root` now, so it does nothing instead
 * of doing half of it.
 *
 * This test will fail the day someone re-declares the theme roles on
 * `[data-theme]` and makes subtree theming real. That is the point: it
 * should fail then, and be replaced by one asserting the new behaviour.
 */
test("a nested theme attribute does not half-apply", async ({ page }) => {
  await story(page);

  const measured = await page.evaluate(() => {
    const host = document.createElement("div");
    host.setAttribute("data-theme", "dark");
    const probe = document.createElement("div");
    probe.style.background = "var(--uix-bg-page)";
    host.appendChild(probe);
    document.body.appendChild(host);
    const out = {
      colourScheme: getComputedStyle(probe).colorScheme,
      background: getComputedStyle(probe).backgroundColor,
      root: getComputedStyle(document.documentElement).backgroundColor,
    };
    host.remove();
    return out;
  });

  expect(
    measured.colourScheme,
    "a nested data-theme still flips color-scheme, which is the half that " +
      "used to make the panel look dark while every token stayed light",
  ).not.toContain("dark");
});
