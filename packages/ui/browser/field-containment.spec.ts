import { expect, test } from "@playwright/test";
import { openStory } from "./ready";

test.use({ viewport: { width: 320, height: 900 } });

for (const theme of ["light", "dark"]) {
  test(`fields stay inside a padded brand panel in ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "foundations-brands--comparison", {
      globals: `theme:${theme}`,
      fonts: true,
    });
    const panels = page.locator(".brand-example");
    await expect(panels).toHaveCount(2);
    for (const panel of await panels.all()) {
      const input = panel.getByRole("textbox", {
        name: "Workshop name",
        exact: true,
      });
      await input.fill(
        "A long workshop name that scrolls inside its own input",
      );
      const bounds = await panel.locator(".uix-field-row").evaluate((row) => {
        const field = row.closest(".uix-field")!.getBoundingClientRect();
        const control = row.getBoundingClientRect();
        return {
          fieldLeft: field.left,
          fieldRight: field.right,
          controlLeft: control.left,
          controlRight: control.right,
        };
      });
      expect(bounds.controlLeft).toBeGreaterThanOrEqual(bounds.fieldLeft - 1);
      expect(bounds.controlRight).toBeLessThanOrEqual(bounds.fieldRight + 1);
      await expect(input).toHaveValue(
        "A long workshop name that scrolls inside its own input",
      );
    }
  });
}
