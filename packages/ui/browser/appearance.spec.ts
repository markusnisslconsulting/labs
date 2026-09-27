import { expect, test, type Locator } from "@playwright/test";
import { openStory } from "./ready";

for (const direction of ["ltr", "rtl"]) {
  test(`data tables retain readable columns in narrow ${direction} layouts`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    for (const density of ["compact", "comfortable"]) {
      await openStory(page, "components-datatable--matrix", {
        globals: `direction:${direction};density:${density}`,
        fonts: true,
      });
      const viewports = page.locator(".uix-datatable-viewport");
      for (const viewport of await viewports.all()) {
        const layout = await viewport.evaluate((node) => {
          const controls = [...node.querySelectorAll("th button, th input")];
          const firstCell = node.querySelector(
            "tbody td:not(.uix-datatable-select)",
          );
          return {
            scrollable: node.scrollWidth > node.clientWidth,
            pageOverflow:
              document.documentElement.scrollWidth > window.innerWidth,
            cellWidth: firstCell!.getBoundingClientRect().width,
            headersFit: controls.every((control) => {
              const box = control.getBoundingClientRect();
              const cell = control.closest("th")!.getBoundingClientRect();
              return box.left >= cell.left && box.right <= cell.right;
            }),
          };
        });
        expect(layout.scrollable).toBe(true);
        expect(layout.pageOverflow).toBe(false);
        expect(layout.cellWidth).toBeGreaterThan(100);
        expect(layout.headersFit).toBe(true);
        await viewport.focus();
        await expect(viewport).toBeFocused();
        const scrollKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
        await expect(async () => {
          await page.keyboard.press(scrollKey);
          expect(
            await viewport.evaluate((node) => Math.abs(node.scrollLeft)),
          ).toBeGreaterThan(0);
        }).toPass();
      }
    }
  });

  test(`calendar targets fit a narrow ${direction} viewport with larger text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    for (const density of ["compact", "comfortable"]) {
      await openStory(page, "components-datepicker--matrix", {
        globals: `direction:${direction};density:${density}`,
      });
      for (const fontSize of ["16px", "32px"]) {
        await page.locator("html").evaluate((node, size) => {
          node.style.fontSize = size;
        }, fontSize);
        const calendar = page
          .locator(".uix-datepicker-calendar[data-open]")
          .first();
        await expect
          .poll(async () => {
            const box = await calendar.boundingBox();
            return box!.x >= -1 && box!.x + box!.width <= 321;
          })
          .toBe(true);
        const days = calendar.getByRole("gridcell");
        const targets = await days.evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            const text = document.createRange();
            text.selectNodeContents(node);
            return {
              width: box.width,
              height: box.height,
              clipped: node.scrollWidth > node.clientWidth + 1,
              textSpace: box.width - text.getBoundingClientRect().width,
            };
          }),
        );
        expect(targets.length).toBeGreaterThanOrEqual(28);
        for (const target of targets) {
          expect(target.width).toBeGreaterThanOrEqual(24);
          expect(target.height).toBeGreaterThanOrEqual(24);
          expect(target.clipped).toBe(false);
          expect(target.textSpace).toBeGreaterThanOrEqual(4);
        }
      }
    }
  });
}

for (const [trigger, selector] of [
  ["Scoped menu", ".uix-menu"],
  ["Scoped popover", ".uix-popover"],
  ["Scoped tooltip", ".uix-tooltip-content"],
  ["Open dialog", ".uix-dialog"],
  ["Open alert", ".uix-dialog"],
  ["Open drawer", ".uix-drawer"],
  ["Open palette", ".uix-palette-search"],
]) {
  test(`${trigger} keeps its local appearance after portaling`, async ({
    page,
  }) => {
    await openStory(page, "guides-appearance-examples--portals");
    const scope = page.getByRole("region", {
      name: "Overlay scope",
      exact: true,
      includeHidden: true,
    });
    const control = page.getByRole("button", { name: trigger!, exact: true });
    // Keyboard focus stays on the trigger when density changes its position.
    if (trigger === "Scoped tooltip") await control.focus();
    else await control.click();
    const popup = page.locator(selector!);
    await expect(popup).toBeVisible();
    const appearance = () =>
      popup.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          direction: style.direction,
          accent: style.getPropertyValue("--uix-accent").trim(),
          density: style.getPropertyValue("--uix-density").trim(),
          padding: parseFloat(style.paddingInlineStart),
        };
      });
    await expect.poll(async () => (await appearance()).density).toBe("0.72");
    const compact = await appearance();
    expect(compact.direction).toBe("rtl");
    expect(compact.accent).toBe(
      await scope.evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--uix-accent").trim(),
      ),
    );
    await scope.evaluate((node) =>
      node.setAttribute("data-density", "comfortable"),
    );
    await expect
      .poll(async () => (await appearance()).padding)
      .toBeGreaterThan(compact.padding);
    await expect.poll(async () => (await appearance()).density).toBe("1.15");
    await scope.evaluate((node) =>
      node.setAttribute("data-brand", "consulting"),
    );
    await expect
      .poll(async () => (await appearance()).accent)
      .not.toBe(compact.accent);
    expect((await appearance()).direction).toBe("rtl");
  });
}

test("the direction toolbar updates layout and keyboard handling without reloading", async ({
  page,
}) => {
  await page.goto("/?path=/story/components-tabs--three-panels");
  const preview = page.frameLocator("#storybook-preview-iframe");
  const tabs = preview.getByRole("tab");
  for (const direction of ["RTL", "LTR", "RTL"]) {
    await page.getByRole("button", { name: /^Writing direction;/ }).click();
    await page.getByRole("option", { name: direction, exact: true }).click();
    await expect(preview.locator("html")).toHaveAttribute(
      "dir",
      direction.toLowerCase(),
    );
    await tabs.first().focus();
    await page.keyboard.press(direction === "RTL" ? "ArrowLeft" : "ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    const first = await tabs.first().boundingBox();
    const second = await tabs.nth(1).boundingBox();
    expect(first!.x > second!.x).toBe(direction === "RTL");
  }
});

test("the density toolbar updates coaching controls and restores the brand default", async ({
  page,
}) => {
  await page.goto(
    "/?path=/story/guides-appearance-examples--density&globals=brand:coaching",
  );
  const preview = page.frameLocator("#storybook-preview-iframe");
  const panel = preview.getByRole("region", {
    name: "Inherited density",
    exact: true,
  });
  await expect(panel).toBeVisible();
  const sizes: number[] = [];
  for (const density of ["Default", "Compact", "Comfortable", "Default"]) {
    await page.getByRole("button", { name: /^Spacing multiplier/ }).click();
    await page.getByRole("option", { name: density, exact: true }).click();
    if (density === "Default")
      await expect(preview.locator("html")).not.toHaveAttribute("data-density");
    else
      await expect(preview.locator("html")).toHaveAttribute(
        "data-density",
        density.toLowerCase(),
      );
    sizes.push(
      await panel.evaluate((node) =>
        parseFloat(getComputedStyle(node).paddingTop),
      ),
    );
  }
  expect(sizes[1]!).toBeLessThan(sizes[0]!);
  expect(sizes[2]!).toBeGreaterThan(sizes[0]!);
  expect(sizes[3]).toBe(sizes[0]);
});

async function dimensions(region: Locator) {
  return region.evaluate((node) => {
    const height = (selector: string) =>
      node.querySelector(selector)!.getBoundingClientRect().height;
    return {
      button: height(".uix-button"),
      field: height(".uix-field-row"),
      checkbox: height(".uix-checkbox"),
      switchRow: height(".uix-switch-row"),
      radio: height(".uix-check"),
      slider: height(".uix-range"),
      badge: height(".uix-badge"),
      padding: parseFloat(getComputedStyle(node).paddingTop),
      gap: parseFloat(getComputedStyle(node.querySelector(".uix-stack")!).gap),
    };
  });
}

for (const theme of ["light", "dark"]) {
  test(`density changes actual controls across brand scopes in ${theme}`, async ({
    page,
  }) => {
    const sizes: Record<
      string,
      Record<string, Awaited<ReturnType<typeof dimensions>>>
    > = {};
    for (const density of ["compact", "default", "comfortable"]) {
      await openStory(page, "guides-appearance-examples--density", {
        globals: `theme:${theme};density:${density}`,
      });
      sizes[density] = {};
      for (const name of [
        "Inherited density",
        "Coaching density",
        "Consulting density",
        "Local comfortable density",
        "Local default density",
      ]) {
        sizes[density]![name] = await dimensions(
          page.getByRole("region", { name, exact: true }),
        );
      }
    }
    for (const name of [
      "Inherited density",
      "Coaching density",
      "Consulting density",
    ]) {
      for (const part of Object.keys(sizes.default![name]!) as (keyof Awaited<
        ReturnType<typeof dimensions>
      >)[]) {
        expect(
          sizes.compact![name]![part],
          `${name}: compact ${part}`,
        ).toBeLessThan(sizes.default![name]![part]);
        expect(
          sizes.comfortable![name]![part],
          `${name}: comfortable ${part}`,
        ).toBeGreaterThan(sizes.default![name]![part]);
      }
      for (const part of [
        "button",
        "field",
        "checkbox",
        "switchRow",
        "radio",
        "slider",
      ] as const) {
        expect(sizes.compact![name]![part]).toBeGreaterThanOrEqual(24);
      }
    }
    for (const density of ["compact", "comfortable"]) {
      // Typography differs by brand; the selected spacing scale does not.
      for (const part of ["gap", "padding"] as const) {
        expect(sizes[density]!["Coaching density"]![part]).toBe(
          sizes[density]!["Consulting density"]![part],
        );
      }
      expect(sizes[density]!["Local comfortable density"]).toEqual(
        sizes.default!["Local comfortable density"],
      );
      expect(sizes[density]!["Local default density"]).toEqual(
        sizes.default!["Local default density"],
      );
    }
  });
}

for (const direction of ["ltr", "rtl"] as const) {
  const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";

  test(`tabs and toolbars follow ${direction} keyboard order`, async ({
    page,
  }) => {
    await openStory(page, "components-tabs--three-panels", {
      globals: `direction:${direction}`,
    });
    const tabs = page.getByRole("tab");
    await tabs.nth(0).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press(forward);
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press(backward);
    await expect(tabs.nth(0)).toBeFocused();

    await openStory(page, "components-toolbar--matrix", {
      globals: `direction:${direction}`,
    });
    const toolbar = page.getByRole("toolbar", {
      name: "Table actions",
      exact: true,
    });
    const controls = toolbar.getByRole("button");
    await controls.nth(0).focus();
    await page.keyboard.press(forward);
    await expect(controls.nth(1)).toBeFocused();
    await page.keyboard.press(backward);
    await expect(controls.nth(0)).toBeFocused();
  });

  test(`tree expansion and calendar arrows follow ${direction}`, async ({
    page,
  }) => {
    await openStory(page, "components-tree--matrix", {
      globals: `direction:${direction}`,
    });
    const tree = page.getByRole("tree", { name: "Folders", exact: true });
    const branch = tree.getByRole("treeitem", {
      name: "European Union",
      exact: true,
    });
    await branch.focus();
    await page.keyboard.press(forward);
    await expect(branch).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press(forward);
    await expect(
      tree.getByRole("treeitem", { name: "Textiles", exact: true }),
    ).toBeFocused();
    await page.keyboard.press(backward);
    await expect(branch).toBeFocused();
    await page.keyboard.press(backward);
    await expect(branch).toHaveAttribute("aria-expanded", "false");

    await openStory(page, "components-datepicker--matrix", {
      globals: `direction:${direction}`,
    });
    const grid = page.getByRole("grid").first();
    const first = grid.locator('[role="gridcell"][tabindex="0"]');
    const date = (await first.getAttribute("data-date"))!;
    const tomorrow = new Date(Date.parse(date) + 86400000)
      .toISOString()
      .slice(0, 10);
    const next = grid.locator(`[data-date="${tomorrow}"]`);
    const current = grid.locator(`[data-date="${date}"]`);
    await first.focus();
    await page.keyboard.press(forward);
    await expect(next).toBeFocused();
    await page.keyboard.press(backward);
    await expect(current).toBeFocused();
  });

  test(`a local ${direction} scope overrides the opposite page direction`, async ({
    page,
  }) => {
    await openStory(page, `guides-appearance-examples--local-${direction}`, {
      globals: `direction:${direction === "rtl" ? "ltr" : "rtl"}`,
    });
    const tabs = page.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press(forward);
    await expect(tabs.nth(1)).toBeFocused();
    const track = await page.getByRole("switch").boundingBox();
    const thumb = await page.locator(".uix-switch-thumb").boundingBox();
    expect(thumb!.x).toBeGreaterThanOrEqual(track!.x);
    expect(thumb!.x + thumb!.width).toBeLessThanOrEqual(
      track!.x + track!.width,
    );
    const scale = await page
      .locator(".uix-pagination svg")
      .first()
      .evaluate((node) => getComputedStyle(node).transform);
    expect(scale).toBe(
      direction === "rtl" ? "matrix(-1, 0, 0, 1, 0, 0)" : "none",
    );
    await page
      .getByRole("button", { name: "Local actions", exact: true })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(
      await page
        .getByRole("menu")
        .evaluate((node) => getComputedStyle(node).direction),
    ).toBe(direction);
  });
}
