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

async function pageBackground(page: Page, theme: string | null) {
  await page.evaluate((value) => {
    const root = document.documentElement;
    if (value === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", value);
  }, theme);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
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
  await story(page);
  const absent = await pageBackground(page, null);
  const light = await pageBackground(page, "light");
  const dark = await pageBackground(page, "dark");

  expect(absent, "no attribute must render the light theme").toEqual(light);
  expect(
    dark.background,
    "the dark theme renders the light page colour; color-scheme is probably gone",
  ).not.toBe(light.background);
  expect(dark.text).not.toBe(light.text);
});

test("auto follows the system in both directions", async ({ page }) => {
  await story(page);

  await page.emulateMedia({ colorScheme: "light" });
  const autoLight = await pageBackground(page, "auto");
  const light = await pageBackground(page, "light");

  await page.emulateMedia({ colorScheme: "dark" });
  const autoDark = await pageBackground(page, "auto");
  const dark = await pageBackground(page, "dark");

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
  await story(page);
  const forcedLight = await pageBackground(page, "light");
  await page.emulateMedia({ colorScheme: "light" });
  const plainLight = await pageBackground(page, "light");
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
  await story(page);
  const read = async (theme: string) => {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-theme", value);
      let host = document.getElementById("brand-probe");
      if (!host) {
        host = document.createElement("div");
        host.id = "brand-probe";
        host.setAttribute("data-brand", "coaching");
        document.body.appendChild(host);
      }
      return null;
    }, theme);
    return page.evaluate(() => {
      const host = document.getElementById("brand-probe")!;
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;color:var(--uix-accent)";
      host.appendChild(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
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
  await story(page);

  const measured = await page.evaluate(async () => {
    const luminance = (colour: string) => {
      const [r, g, b] = (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const linear = [r!, g!, b!].map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
    };

    const read = async (theme: string) => {
      document.documentElement.setAttribute("data-theme", theme);
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
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
    };

    return { light: await read("light"), dark: await read("dark") };
  });

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
