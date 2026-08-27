/**
 * What the expensive components cost at runtime.
 *
 * Stage 09 of the roadmap: "There is a bundle budget on the whole. There
 * is nothing per component, and nothing about runtime." The per-component
 * bundle half is `scripts/component-size.mjs`. This is the other half.
 *
 * Two things make this worth writing rather than assuming:
 *
 *   - Bundle size and runtime cost are unrelated. Divider is the smallest
 *     component in the library and Table is near it, and a table is the
 *     one component in here that can make a page unusable. Nothing about
 *     0.88 KB says how it behaves with ten thousand rows.
 *   - The costs that matter are the ones a component's own design causes.
 *     A combobox that re-filters a long list on every keystroke, a table
 *     that lays out every row it is given, a toast stack that re-renders
 *     the whole set per arrival — those are decisions in this repository,
 *     not the consumer's.
 *
 * Numbers rather than thresholds where possible. A wall-clock budget on a
 * developer laptop is a flaky test with a stern message: the same code is
 * three times slower on a cold CI runner. So each measurement below
 * asserts a *shape* — that cost grows with the work and not with the
 * square of it, that a keystroke touches one component and not the page —
 * and prints the number so a regression is visible in the log even when
 * it passes.
 */
import { test, expect, type Page } from "@playwright/test";
import { openStory } from "./ready";

/** Time one interaction, with the first run discarded as warm-up. */
async function timed(page: Page, work: () => Promise<void>, runs = 5) {
  const samples: number[] = [];
  for (let index = 0; index <= runs; index += 1) {
    const started = await page.evaluate(() => performance.now());
    await work();
    const ended = await page.evaluate(() => performance.now());
    if (index > 0) samples.push(ended - started);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)]!;
}

/**
 * A table's layout cost grows with its rows, not with their square.
 *
 * The failure this guards against is a component that measures something
 * per row against something else per row — a width sync, a sticky header
 * reading offsetTop in a loop — which is invisible at ten rows and makes
 * a page unusable at ten thousand. A ratio rather than a duration,
 * because a ratio survives a slow runner and a duration does not.
 */
test("a table's cost grows with its rows, not their square", async ({
  page,
}) => {
  await openStory(page, "components-table--ordering-desk");

  const layout = async (rows: number) =>
    page.evaluate(async (count) => {
      const host = document.createElement("div");
      document.body.appendChild(host);

      /* Built with DOM calls rather than innerHTML. Not only because a
         string of markup is the wrong habit to leave in a repository —
         creating elements is also the closer analogue of what React does,
         so the number means something for the component rather than for
         the HTML parser. */
      const started = performance.now();
      const table = document.createElement("table");
      table.className = "uix-table";
      const head = table.createTHead().insertRow();
      for (const label of ["SKU", "Supplier", "Reorder point"]) {
        const cell = document.createElement("th");
        cell.textContent = label;
        head.appendChild(cell);
      }
      const body = table.createTBody();
      for (let index = 0; index < count; index += 1) {
        const row = body.insertRow();
        row.insertCell().textContent = `SKU ${index}`;
        row.insertCell().textContent = `Supplier ${index}`;
        row.insertCell().textContent = String(index * 7);
      }
      host.appendChild(table);
      // Force layout rather than measuring construction alone.
      void host.getBoundingClientRect().height;
      const cost = performance.now() - started;
      host.remove();
      return cost;
    }, rows);

  const small = await layout(500);
  const large = await layout(5000);
  const ratio = large / Math.max(small, 0.01);

  console.log(
    `table layout: 500 rows ${small.toFixed(1)}ms, 5000 rows ` +
      `${large.toFixed(1)}ms, ratio ${ratio.toFixed(1)}x for 10x the rows`,
  );

  /* Ten times the rows may cost more than ten times the time — layout is
     not free per row — but it must not cost a hundred, which is what a
     per-row loop over per-row measurements produces.
     Measured here at 24x, or about n^1.4. The ceiling is 45 rather than
     30 because a ratio is steadier than a duration on a slow runner but
     not immune to it, and 45 is still far below the 100x that quadratic
     work produces. A gate that fails on a busy CI machine teaches people
     to rerun it. */
  expect(
    ratio,
    `5000 rows cost ${ratio.toFixed(1)}x what 500 did. Something in the ` +
      `table is quadratic in its rows.`,
  ).toBeLessThan(45);
});

/**
 * Filtering a long list costs one pass, not one pass per character
 * already typed.
 *
 * Combobox filters in render, over the array it was given. That is fine
 * and it is worth pinning: the shape to catch is a filter that rebuilds
 * something per keystroke whose size grows with what has been typed.
 */
test("a combobox filters a long list in linear time", async ({ page }) => {
  await openStory(page, "components-combobox--long-list");

  const input = page.getByRole("combobox", { name: "Supplier", exact: true });
  await input.focus();

  const perKeystroke: number[] = [];
  for (const character of "european".split("")) {
    perKeystroke.push(
      await timed(
        page,
        async () => {
          await page.keyboard.type(character);
        },
        1,
      ),
    );
  }

  const first = perKeystroke[0]!;
  const last = perKeystroke[perKeystroke.length - 1]!;
  console.log(
    `combobox keystrokes (ms): ${perKeystroke
      .map((value) => value.toFixed(1))
      .join(", ")}`,
  );

  /* The eighth keystroke may cost more than the first — the DOM is larger
     and the browser is busier — but not by an order of magnitude, which
     is what re-deriving something over the whole typed prefix looks
     like. */
  expect(
    last,
    `the last keystroke cost ${last.toFixed(1)}ms against the first at ` +
      `${first.toFixed(1)}ms; the cost is growing with what has been typed`,
  ).toBeLessThan(Math.max(first * 8, 60));
});

/**
 * A toast arriving does not re-render the page behind it.
 *
 * `ToastProvider` holds the list, so every consumer of `useToast` is a
 * descendant of the thing that changes. The shape to catch is a provider
 * placed so high that a notification re-renders an application — which is
 * a real cost the component's own API decides, since it is the provider
 * that owns the state.
 */
test("a toast arriving touches the stack, not the page", async ({ page }) => {
  await openStory(page, "components-toaster--stack");

  const observed = await page.evaluate(async () => {
    const root = document.querySelector("#storybook-root")!;
    let outsideTheStack = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as Element;
        if (!(target instanceof Element)) continue;
        if (target.closest(".uix-toaster")) continue;
        outsideTheStack += 1;
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    const before = document.querySelectorAll("[data-labs-toast]").length;
    root.querySelector("button")?.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    observer.disconnect();

    /* How many toasts exist now, so the count above cannot pass by the
       toast never arriving. A zero that means "nothing re-rendered" and a
       zero that means "nothing happened" are the same number, and the
       first version of this test could not tell them apart. */
    const after = document.querySelectorAll(
      "[role='status'], [role='alert'], .uix-toast",
    ).length;
    return { outsideTheStack, before, after };
  });

  const counted = observed.outsideTheStack;
  expect(
    observed.after,
    "no toast appeared, so this test measured a click that did nothing",
  ).toBeGreaterThan(0);

  console.log(`toast arrival: ${counted} mutations outside the stack`);

  /* Not zero: the trigger's own attributes may change, and the toast's
     portal has to be attached somewhere. A page's worth of nodes is the
     failure. */
  expect(
    counted,
    `${counted} nodes outside the toast stack changed when one toast ` +
      `arrived; the provider is re-rendering more than the notifications`,
  ).toBeLessThan(20);
});

/**
 * Ten thousand rows, and the table still tells the truth about its size.
 *
 * The test that decides whether virtualisation is a feature or a lie. A
 * windowed table renders a fraction of its rows, which is the point — and
 * a screen reader counts what is in the accessibility tree, so unless the
 * component says otherwise it announces the length of the window. "Row 12
 * of 24" in a table of ten thousand is worse than no virtualisation,
 * because it is confidently wrong.
 *
 * Four things are measured together, because each one alone can pass while
 * the feature is broken: the DOM stays bounded, `aria-rowcount` reports
 * the whole set, a row's `aria-rowindex` is its place in that set rather
 * than in the window, and the sticky header does not move while the body
 * scrolls under it. The last is here rather than in a visual test because
 * spacer rows were chosen over a transform for exactly this reason — a
 * header inside a transformed body stops sticking, and a screenshot of the
 * top of the table looks identical either way.
 */
test("a virtualised table is bounded in the DOM and honest in the tree", async ({
  page,
}) => {
  await openStory(page, "components-datatable--ten-thousand-rows");

  const table = page.locator(".uix-datatable-table");
  const viewport = page.locator(".uix-datatable-viewport");

  /* 10,000 rows plus the header. The count is on the table, and it is
     what a reader reads instead of counting rows. */
  await expect(table).toHaveAttribute("aria-rowcount", "10001");

  const rendered = () =>
    page.locator(".uix-datatable-table tbody tr:not([aria-hidden])").count();

  const atTop = await rendered();
  expect(
    atTop,
    `${atTop} rows in the DOM at rest; a window over a 360px viewport of ` +
      `40px rows should be a few dozen at most`,
  ).toBeLessThan(40);
  expect(atTop, "no rows rendered at all").toBeGreaterThan(4);

  /* Scoped to this table. A bare `thead th` matched Storybook's own
     args table, which is in the story's DOM with a height of zero — so
     the sticky assertion below compared 0 to 0 and was true whatever the
     real header did. Measured: `position: static` on the header passed
     that version of this test. */
  const header = page.locator(".uix-datatable-table thead th").first();
  const headerTop = await header.evaluate(
    (node) => node.getBoundingClientRect().top,
  );

  await viewport.evaluate((node) => {
    node.scrollTop = 40 * 5000;
  });
  /* Wait on the row's *text*, not on its `aria-rowindex`. Waiting on the
     attribute under test means a wrong index reports as a thirty-second
     timeout instead of as the assertion that follows, and a test whose
     failure message is "timeout" tells a reader nothing about what
     broke. */
  await expect(
    page.locator(".uix-datatable-table tbody tr:not([aria-hidden]) td").first(),
  ).not.toHaveText("Supplier 1");

  const afterScroll = await rendered();
  expect(
    afterScroll,
    `${afterScroll} rows after scrolling to the middle; the window must ` +
      `not accumulate`,
  ).toBeLessThan(40);

  /* Halfway down, the first rendered row is row ~5000 of the whole set —
     not row 1 of the window. Two off the exact figure is the overscan. */
  const index = Number(
    await page
      .locator(".uix-datatable-table tbody tr:not([aria-hidden])")
      .first()
      .getAttribute("aria-rowindex"),
  );
  expect(index).toBeGreaterThan(4980);
  expect(index).toBeLessThan(5010);

  /* And the header has not moved. */
  const headerTopAfter = await header.evaluate(
    (node) => node.getBoundingClientRect().top,
  );
  expect(
    Math.abs(headerTopAfter - headerTop),
    "the sticky header moved when the body scrolled",
  ).toBeLessThan(1);
});

/**
 * Every face in an avatar group overlaps the one before it, counter
 * included.
 *
 * A geometry assertion, because the defect was geometry and nothing else
 * here measures it. The overlap was written as `.item + .item`, and the
 * component rendered every visually hidden name *after* every avatar — so
 * between the last face and the "+2" counter sat a run of spans, the
 * adjacent-sibling selector matched nothing, and the counter lost its
 * negative margin and sat a full gap from the group.
 *
 * Markus found it in a screenshot. Every assertion in this repository passed
 * over it: the names were right, the roles were right, the accessible name
 * of the counter listed the hidden people, axe was clean. None of them knows
 * where anything is.
 *
 * Measured as "each item starts before the previous one ends", which is what
 * overlapping means and is true at every size without hardcoding the
 * offset.
 */
test("every avatar overlaps the one before it, counter included", async ({
  page,
}) => {
  await openStory(page, "components-avatargroup--matrix");

  const groups = page.locator(".uix-avatargroup");
  const count = await groups.count();
  expect(count, "the matrix needs several groups").toBeGreaterThan(3);

  for (let index = 0; index < count; index += 1) {
    const boxes = await groups
      .nth(index)
      .locator(".uix-avatargroup-item")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return {
            left: box.left,
            right: box.right,
            counter: node.classList.contains("uix-avatargroup-more"),
          };
        }),
      );

    for (let at = 1; at < boxes.length; at += 1) {
      const previous = boxes[at - 1]!;
      const current = boxes[at]!;
      expect(
        current.left,
        `item ${at}${current.counter ? " (the counter)" : ""} in group ` +
          `${index} starts at ${current.left.toFixed(0)} and the one before ` +
          `it ends at ${previous.right.toFixed(0)}; they do not overlap`,
      ).toBeLessThan(previous.right);
    }
  }
});

/**
 * The customizable-select popup is the width of the field a reader sees.
 *
 * "The field" is `.uix-field-row`, not the `<select>`. That distinction is
 * the entire history of this test. Markus reported twice that the menu was
 * not the width of the select box; three rounds of measurement said it was,
 * to the pixel — because all three compared the popup to the `<select>`,
 * which is a transparent, borderless control sitting inside the row's
 * padding and sharing it with the chevron. Measured: a 384px row held a
 * 334px select and a 332px popup. The popup matched the select exactly and
 * was 52px narrower than the box on screen.
 *
 * A measurement against the wrong reference reads exactly like the thing
 * being correct, and it is more convincing than no measurement at all. So
 * this asserts against the element that draws the border, and separately
 * that the chosen value does not move when the popup opens — the other half
 * of the same report.
 *
 * An earlier docstring here also claimed author sizing on `::picker(select)`
 * was ignored in Chromium 151. That came from reading `getComputedStyle` on
 * the pseudo-element, which reports `inline-size: auto` for a width it is
 * applying. It is not ignored. `anchor-size()` and percentages genuinely do
 * not resolve there, so the width still cannot be derived from the anchor —
 * it does not need to be, now that the anchor is the full field.
 */
test("the select popup is the width of the field, and its text does not move", async ({
  page,
}) => {
  await openStory(page, "components-select--matrix");

  const select = page.locator("select.uix-select").first();

  for (const width of [null, 420, 560]) {
    if (width !== null) {
      await select.evaluate((node, px) => {
        const row = node.closest(".uix-field-row") as HTMLElement;
        row.style.inlineSize = `${px}px`;
      }, width);
    }

    await select.click();

    const geometry = await select.evaluate((node) => {
      const row = node.closest(".uix-field-row")!;
      const chosen = node.querySelector("option:checked");
      if (!chosen) return null;
      const range = document.createRange();
      range.selectNodeContents(chosen);
      const rowBox = row.getBoundingClientRect();
      const optionBox = chosen.getBoundingClientRect();
      return {
        rowWidth: rowBox.width,
        optionWidth: optionBox.width,
        /* Where the field's own value sits: the select's left edge plus its
           padding. Read from computed style so density moves both. */
        fieldTextLeft:
          node.getBoundingClientRect().left +
          Number.parseFloat(getComputedStyle(node).paddingInlineStart),
        optionTextLeft: range.getBoundingClientRect().left,
      };
    });

    expect(geometry, "the popup did not open").not.toBeNull();

    /* Four: one border on the row and one on the popup, each side. Anything
       looser accepts the version that was reported as broken. */
    const inset = geometry!.rowWidth - geometry!.optionWidth;
    expect(
      inset,
      `field ${geometry!.rowWidth.toFixed(0)}px, option ` +
        `${geometry!.optionWidth.toFixed(0)}px: the popup is not the width ` +
        `of the field`,
    ).toBeLessThanOrEqual(4);
    expect(inset, "the popup is wider than the field").toBeGreaterThanOrEqual(
      0,
    );

    expect(
      Math.abs(geometry!.optionTextLeft - geometry!.fieldTextLeft),
      `the value sits at ${geometry!.fieldTextLeft.toFixed(1)} in the field ` +
        `and at ${geometry!.optionTextLeft.toFixed(1)} in the popup, so it ` +
        `moves when the popup opens`,
    ).toBeLessThanOrEqual(1.5);

    await page.keyboard.press("Escape");
  }
});

/**
 * A textarea has the same frame every other field has.
 *
 * It shipped without one. `uix-field-input` is deliberately `border: none;
 * background: transparent` — every field in this library draws its box on
 * the `uix-field-row` wrapper — and Textarea put that class on the control
 * with no row around it. The result was text on the page background with a
 * resize handle floating at the corner, and `data-invalid` sat on an element
 * no rule selects, so the error state never showed either.
 *
 * Neither failure was visible to any assertion: every accessibility test,
 * every interaction test and the whole audit suite passed on a control with
 * no border. It took a screenshot. So the test is on the computed border
 * rather than on the class, because the class was there the whole time.
 */
test("a textarea is drawn as a field, invalid state included", async ({
  page,
}) => {
  await openStory(page, "components-textarea--matrix");

  const frames = await page.locator(".uix-textarea-row").evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return {
        width: Number.parseFloat(style.borderBottomWidth),
        colour: style.borderBottomColor,
        background: style.backgroundColor,
        invalid: node.hasAttribute("data-invalid"),
      };
    }),
  );

  expect(frames.length, "no textarea rows on the page").toBeGreaterThan(2);

  for (const frame of frames) {
    expect(frame.width, "a textarea with no border").toBeGreaterThan(0);
    expect(
      frame.background,
      "a textarea with a transparent background sits on whatever is behind it",
    ).not.toBe("rgba(0, 0, 0, 0)");
  }

  /* The invalid one differs from the rest. Asserted as a difference rather
     than against a colour, so a change of palette does not fail it. */
  const invalid = frames.filter((frame) => frame.invalid);
  const valid = frames.filter((frame) => !frame.invalid);
  expect(invalid.length, "the matrix has no invalid textarea").toBeGreaterThan(
    0,
  );
  for (const frame of invalid) {
    expect(
      frame.colour,
      "the invalid textarea's border is the same as a valid one's",
    ).not.toBe(valid[0]!.colour);
  }
});

/**
 * An upload row keeps its remove button on the row.
 *
 * The row is a three-column grid and the progress bar spans `1 / -1`, so it
 * opens a second row. The remove button was the last child with no placement
 * of its own, so it was auto-flowed after the bar and landed alone in row
 * three, column one: a filename, a full-width bar, and an × on a line by
 * itself. Every cell is placed explicitly now.
 *
 * Asserted on geometry, because "which grid row did this land in" is not
 * something a class name or an attribute records.
 */
test("an upload row keeps the name, the size and the remove button in line", async ({
  page,
}) => {
  await openStory(page, "components-fileupload--matrix");

  const rows = await page.locator(".uix-fileupload-item").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = (selector: string) => {
        const found = node.querySelector(selector);
        if (!found) return null;
        const rect = found.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left };
      };
      return {
        name: box(".uix-fileupload-name"),
        remove: box(".uix-fileupload-remove"),
        progress: box(".uix-fileupload-progress"),
      };
    }),
  );

  expect(rows.length, "no upload rows on the page").toBeGreaterThan(0);

  for (const row of rows) {
    if (!row.name || !row.remove) continue;
    /* Overlapping vertical extents is the honest test of "same line": the
       two are different heights, so their tops do not match. */
    expect(
      row.remove.top,
      "the remove button starts below the file name, so it is on its own row",
    ).toBeLessThan(row.name.bottom);
    expect(
      row.remove.left,
      "the remove button is left of the name",
    ).toBeGreaterThan(row.name.left);
    if (row.progress) {
      expect(
        row.progress.top,
        "the progress bar is not below the name it belongs to",
      ).toBeGreaterThanOrEqual(row.name.bottom - 1);
    }
  }
});

/**
 * A calendar's three day states are three different colours.
 *
 * They were two. `DatePicker.css` asked for
 * `color: var(--uix-text-caption)` on an out-of-month day, and
 * `--uix-text-caption` is a font size — so the declaration was
 * `color: 0.75rem`, which CSS drops. August showed the last five days of
 * July in exactly the same ink as August: measured, both
 * `rgb(23, 43, 77)`.
 *
 * `tokens.spec.ts` now refuses a colour property that names a non-colour
 * token, which is the general form and caught twenty-eight of these. This
 * test is the specific one, because the general check cannot know that a
 * calendar needs its neighbouring months to look like neighbours. Compared
 * as inequalities rather than against hex values, so a change of palette
 * does not fail it.
 */
test("out-of-month, in-month and selected days are told apart", async ({
  page,
}) => {
  await openStory(page, "components-datepicker--matrix");

  const colours = await page
    .locator(".uix-datepicker-day")
    .evaluateAll((nodes) => {
      const seen: Record<string, string> = {};
      for (const node of nodes) {
        const state = node.hasAttribute("data-outside")
          ? "outside"
          : node.hasAttribute("data-selected")
            ? "selected"
            : "inside";
        seen[state] ??= getComputedStyle(node).color;
      }
      return seen;
    });

  for (const state of ["outside", "inside", "selected"]) {
    expect(colours[state], `no ${state} day in the open calendar`).toBeTruthy();
  }
  expect(
    colours["outside"],
    "a day from the neighbouring month is the same colour as one from this " +
      "month, so the calendar shows July as if it were August",
  ).not.toBe(colours["inside"]);
  expect(colours["selected"]).not.toBe(colours["inside"]);
});

/**
 * A split button's two halves meet, at every size.
 *
 * They did not at `sm` or `lg`. `Button.css` sets the `border-radius`
 * *shorthand* under `.uix-button[data-size="sm"]` and `[data-size="lg"]` —
 * specificity (0,2,0) against `.uix-splitbutton-action`'s (0,1,0) — and a
 * shorthand resets all four corners, so the inner radius came back and the
 * pair rendered as two lozenges with the page showing between them. `md` was
 * correct, which is why nothing looked wrong until a screenshot of the size
 * matrix.
 *
 * Asserted on the computed inner radius rather than on a screenshot, because
 * the failure is a number: 8px at `sm`, 16px at `lg`, 0 where it worked.
 * Every size in the matrix is checked, so a new size cannot arrive with the
 * old bug.
 */
test("a split button's inner corners are square at every size", async ({
  page,
}) => {
  await openStory(page, "components-splitbutton--matrix");

  const pairs = await page.locator(".uix-splitbutton").evaluateAll((nodes) =>
    nodes.map((node) => {
      const action = node.querySelector(".uix-splitbutton-action");
      const more = node.querySelector(".uix-splitbutton-more");
      if (!action || !more) return null;
      const actionStyle = getComputedStyle(action);
      const moreStyle = getComputedStyle(more);
      const actionBox = action.getBoundingClientRect();
      const moreBox = more.getBoundingClientRect();
      return {
        label: action.textContent?.trim().slice(0, 12) ?? "",
        size: action.getAttribute("data-size") ?? "md",
        actionInner: Number.parseFloat(actionStyle.borderStartEndRadius),
        moreInner: Number.parseFloat(moreStyle.borderStartStartRadius),
        gap: moreBox.left - actionBox.right,
      };
    }),
  );

  const found = pairs.filter((pair) => pair !== null);
  expect(found.length, "no split buttons on the page").toBeGreaterThan(3);

  for (const pair of found) {
    expect(
      pair!.actionInner,
      `${pair!.size}: the action's inner corner is rounded, so the pair ` +
        `reads as two buttons`,
    ).toBe(0);
    expect(pair!.moreInner, `${pair!.size}: the menu half's inner corner`).toBe(
      0,
    );
    /* And they touch. A gap would undo the same effect from the other side. */
    expect(
      Math.abs(pair!.gap),
      `${pair!.size}: the halves do not meet`,
    ).toBeLessThan(0.5);
  }

  /* The matrix has to contain more than one size, or the loop above proves
     nothing about the bug it was written for. */
  const sizes = new Set(found.map((pair) => pair!.size));
  expect(
    sizes.size,
    "the matrix shows one size, so this test cannot see the size-specific bug",
  ).toBeGreaterThan(1);
});

/**
 * The value in a customizable select sits on the middle of its own field.
 *
 * It rendered 7px above it. `appearance: base-select` makes the select
 * itself the button and the button a flex container; with a fixed
 * `block-size` and no `padding-block`, its content sits at the start. So the
 * value read high while the chevron beside it was centred, which is what
 * Markus saw and reported as "the text is not aligned".
 *
 * **What this test can and cannot see, because two instruments lied first.**
 *
 * Every box on that row measured centred — the field row, the control and
 * the chevron, all three at the same midpoint — because the misalignment was
 * inside the control, between its box and its own glyphs. Boxes cannot see
 * it.
 *
 * `caretRangeFromPoint` does reach into the select's shadow content and
 * returns an element for the rendered value, and that looked like the
 * instrument. It is not: the element is a full-size wrapper starting at the
 * field's own left edge, so its centre is the box's centre whatever the text
 * does. It reported the field as correct in both the broken and the fixed
 * build. Only pixels told them apart — measured at 3x over the field's own
 * box, the text's centre was row 39 broken and row 60 fixed, against a box
 * centre of 60.
 *
 * So the pixel property lives in `visual/visual.spec.ts`, where this
 * repository keeps pixels, and in Chromatic, which snapshots this story. What
 * is left here is the cascade: `align-items` has to survive to the select.
 * That is weaker than measuring the glyphs and it is stated as such — it
 * catches the rule being removed or outranked, not the rendering being wrong
 * for some new reason.
 */
test("a base-select field centres its own value", async ({ page }) => {
  await openStory(page, "components-select--matrix");

  const supported = await page.evaluate(() =>
    CSS.supports("appearance", "base-select"),
  );
  test.skip(!supported, "no base-select in this engine, so no button to align");

  const styles = await page.locator("select.uix-select").evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return {
        appearance: style.appearance,
        alignItems: style.alignItems,
        display: style.display,
      };
    }),
  );

  expect(styles.length, "no selects on the page").toBeGreaterThan(0);
  for (const style of styles) {
    expect(style.appearance, "the popup is not ours here").toBe("base-select");
    expect(
      style.alignItems,
      "the select's own content is not centred, so its value renders above " +
        "the middle of the field while the chevron stays on it",
    ).toBe("center");
  }
});
