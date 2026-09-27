import { expect, test, type Locator } from "@playwright/test";
import { openStory } from "./ready";

async function appearance(panel: Locator) {
  return panel.evaluate((node) => {
    const panel = getComputedStyle(node);
    const heading = getComputedStyle(node.querySelector("h2")!);
    const input = getComputedStyle(node.querySelector("input")!);
    const raised = getComputedStyle(
      node.querySelector(".brand-example-raised")!,
    );
    return {
      radius: panel.borderRadius,
      padding: panel.padding,
      body: panel.fontFamily,
      leading: panel.lineHeight,
      heading: heading.fontFamily,
      weight: heading.fontWeight,
      tracking: heading.letterSpacing,
      headingLeading: heading.lineHeight,
      controlRadius: input.borderRadius,
      controlFont: input.fontFamily,
      elevation: raised.boxShadow,
      density: panel.getPropertyValue("--uix-density").trim(),
      accent: panel.getPropertyValue("--uix-accent").trim(),
      focus: panel.getPropertyValue("--uix-focus-ring").trim(),
      soft: panel.getPropertyValue("--uix-accent-soft").trim(),
    };
  });
}

for (const theme of ["light", "dark"]) {
  test(`brand sections retain their appearance inside either page brand in ${theme}`, async ({
    page,
  }) => {
    const samples: Record<string, Awaited<ReturnType<typeof appearance>>[]> =
      {};
    for (const rootBrand of ["default", "coaching"]) {
      await openStory(page, "foundations-brands--comparison", {
        globals: `theme:${theme}${rootBrand === "default" ? "" : ";brand:coaching"}`,
      });
      samples[rootBrand] = [];
      for (const name of ["Consulting", "Coaching"]) {
        samples[rootBrand]!.push(
          await appearance(page.getByRole("region", { name, exact: true })),
        );
      }
    }
    expect(samples.coaching).toEqual(samples.default);
    expect(samples.default![0]!.density).toBe("1");
    expect(samples.default![1]!.density).toBe("1.12");
    for (const sample of samples.default!) {
      expect(sample.focus).toBe(sample.accent);
      expect(sample.soft).toContain(sample.accent);
    }

    const consulting = page.getByRole("region", {
      name: "Consulting",
      exact: true,
    });
    const save = consulting.getByRole("button", {
      name: "Save example",
      exact: true,
    });
    const normal = (await save.boundingBox())!.height;
    await consulting.evaluate((node) =>
      node.setAttribute("data-density", "compact"),
    );
    const compact = (await save.boundingBox())!.height;
    expect(compact).toBeLessThan(normal);
    expect(compact).toBeGreaterThanOrEqual(24);
  });
}
