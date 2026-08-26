/**
 * The control scale holds on every axis, not just the one it was drawn
 * on.
 *
 * The first version of this test asserted 32, 40 and 48 pixels. That is
 * true of exactly one configuration: default density at a 16px root. A
 * design system that offers density as a product axis and has to survive
 * a reader who sets their browser font to 20px cannot state its contract
 * in pixels. So the numbers come out of the page instead: the test reads
 * the computed value of --uix-control-sm/md/lg in whatever configuration
 * it has just set, and checks the controls against that.
 *
 * The contract, in three parts:
 *
 *   1. A control's floor is one of the three control tokens. This is the
 *      design language: a button, a field and a stepper in one row line
 *      up because they were all given the same floor, not because they
 *      happened to measure the same.
 *   2. A control may grow past its floor when its own content needs the
 *      room, which is what happens at large font sizes, and it must not
 *      clip when it does. A floor that behaves as a fixed height is how
 *      text resize breaks a UI.
 *   3. No floor drops below 24 CSS px in any density, which is WCAG 2.2
 *      target size (minimum, 2.5.8).
 *
 * Two bugs this catches, both of which shipped and neither of which a
 * pixel assertion at one configuration would have kept out: a chip with
 * no floor at all that landed on 31.7px, and a field whose floor was
 * right but which rendered two pixels over it because nothing in the
 * library had ever set box-sizing.
 */
import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SELECTORS = [
  ".uix-button",
  ".uix-iconbutton",
  ".uix-field-row",
  ".uix-search",
  ".uix-tab",
  ".uix-segment",
  ".uix-numberfield",
  ".uix-chip",
  ".uix-accordion-trigger",
];

/**
 * The switch track is deliberately not on the scale. It is not a box
 * anyone aims into, it is a picture of a state, and at a control height
 * it reads as a pill-shaped button. Its label is the target, and the
 * label is inside a row that is on the scale.
 */
const EXEMPT = [".uix-switch"];

/** WCAG 2.2, 2.5.8 Target Size (Minimum). */
const TARGET_MIN = 24;

/**
 * The axes a product actually ships on. Root font size stands in for a
 * reader who has set their browser text larger, which is the resize
 * requirement in WCAG 1.4.4 and the case a rem scale exists for.
 */
const AXES = [
  { density: "cozy", root: "16px" },
  { density: "compact", root: "16px" },
  { density: "cozy", root: "20px" },
  { density: "compact", root: "20px" },
];

const index = JSON.parse(
  readFileSync("dist/packages/ui-storybook/index.json", "utf8"),
) as { entries: Record<string, { type: string; title: string; name: string }> };

/**
 * The stories Chromatic photographs, which is one per component by
 * policy and is the story that shows every variant at once.
 *
 * Selecting by the name "Matrix" was the first attempt and it skipped
 * every component whose all-variants story carries a domain name —
 * StatusPill's AllTones, Toaster's Stack, Card's WithSlots. A gate that
 * silently measures two thirds of the library is worse than no gate,
 * because it reports success.
 */
function snapshotted(): string[] {
  const dir = "packages/ui/src/components";
  const ids: string[] = [];
  const byId = new Set(Object.keys(index.entries));

  for (const file of readdirSync(dir).filter((f) =>
    f.endsWith(".stories.tsx"),
  )) {
    const source = readFileSync(join(dir, file), "utf8");
    const title = /title:\s*"([^"]+)"/.exec(source)?.[1];
    if (!title) continue;
    // Storybook's own id scheme, so the result can be checked against
    // the built index rather than trusted.
    const prefix = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    for (const [, name, body] of source.matchAll(
      /export const (\w+)[^=]*=\s*\{([\s\S]*?)(?=\nexport const |$)/g,
    )) {
      if (!/disableSnapshot:\s*false/.test(body!)) continue;
      const id = `${prefix}--${name!
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
        .toLowerCase()}`;
      if (!byId.has(id)) {
        throw new Error(
          `derived story id ${id} (from ${file}, export ${name}) is not in the built index; the id scheme has drifted`,
        );
      }
      ids.push(id);
    }
  }
  return ids;
}

const targets = snapshotted();

test("every component contributes a snapshotted story to measure", () => {
  const components = readdirSync("packages/ui/src/components").filter((f) =>
    f.endsWith(".stories.tsx"),
  );
  // One photographed story per component is the policy; this is where a
  // component that quietly stopped being photographed shows up.
  expect(targets.length).toBeGreaterThanOrEqual(components.length - 3);
});

for (const id of targets) {
  test(`${id} holds the scale across density and text size`, async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`, {
      waitUntil: "networkidle",
    });

    for (const axis of AXES) {
      const result = await page.evaluate(
        async ({ selectors, exempt, axis, targetMin }) => {
          const root = document.documentElement;
          root.setAttribute("data-density", axis.density);
          root.style.fontSize = axis.root;
          // Two frames, so layout has settled before anything is read.
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );

          // A custom property is not resolved by getComputedStyle unless it
          // has been registered with @property; asking for it returns the
          // literal "calc(2.5rem * var(--uix-density))". So the tokens are
          // measured the way the browser uses them: on a real box.
          const px = (name: string) => {
            const probe = document.createElement("div");
            probe.style.cssText = `position:absolute;visibility:hidden;height:var(${name})`;
            root.appendChild(probe);
            const height = probe.getBoundingClientRect().height;
            probe.remove();
            return height;
          };
          const floors = [
            px("--uix-control-sm"),
            px("--uix-control-md"),
            px("--uix-control-lg"),
          ];

          const problems: string[] = [];
          for (const floor of floors) {
            if (floor < targetMin) {
              problems.push(
                `a control floor resolves to ${floor.toFixed(1)}px, under the ${targetMin}px target minimum`,
              );
            }
          }

          const on = (value: number) =>
            floors.some((floor) => Math.abs(floor - value) < 0.75);

          for (const selector of selectors) {
            if (exempt.includes(selector)) continue;
            for (const el of document.querySelectorAll(selector)) {
              const style = getComputedStyle(el);
              const box = el.getBoundingClientRect();
              if (box.height === 0) continue;
              const label = `${selector} "${(el.textContent ?? "").trim().slice(0, 18)}"`;
              const floor = parseFloat(style.minHeight);

              if (!Number.isFinite(floor) || !on(floor)) {
                problems.push(
                  `${label} has a floor of ${style.minHeight}, which is not one of ` +
                    `${floors.map((f) => f.toFixed(1)).join(" / ")}`,
                );
                continue;
              }
              if (box.height < floor - 0.75) {
                problems.push(
                  `${label} is ${box.height.toFixed(1)}px, under its own ${floor.toFixed(1)}px floor`,
                );
              }
              // Growing past the floor is allowed; clipping is not.
              if (el.scrollHeight > el.clientHeight + 1) {
                problems.push(
                  `${label} clips its content (${el.scrollHeight} into ${el.clientHeight})`,
                );
              }
            }
          }
          return { problems, floors };
        },
        { selectors: SELECTORS, exempt: EXEMPT, axis, targetMin: TARGET_MIN },
      );

      expect(
        result.problems,
        `density=${axis.density} root=${axis.root} ` +
          `(floors ${result.floors.map((f) => f.toFixed(1)).join("/")}):\n` +
          result.problems.map((p) => `  ${p}`).join("\n"),
      ).toEqual([]);
    }
  });
}
