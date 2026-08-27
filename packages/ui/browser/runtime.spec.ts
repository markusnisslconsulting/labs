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
 * The customizable-select popup is the width of the field, at any width.
 *
 * Written because the comment in `Select.css` claimed the opposite for a
 * while. The first measurement was taken with
 * `getComputedStyle(el, "::picker(select)")`, which reports `inline-size:
 * auto` for a width it is in fact applying, so the conclusion "author
 * sizing on this pseudo-element is not honoured" was an artefact of the
 * instrument. Pixels for anything in the top layer.
 *
 * The property asserted is tracking, not a number: the field is widened at
 * runtime and the popup has to follow. A fixed expectation would pass on a
 * popup that happened to be 302px for its own reasons.
 *
 * What it can and cannot catch, because the first version of this comment
 * overstated it. An option wider than its picker overflows rather than
 * shrinking, so an option's box is the picker's content width only while
 * the picker is the wider of the two. Trying to break this by forcing the
 * picker to 200px changed nothing — Chromium floors the picker at the
 * anchor's width, so "narrower than the field" is not a state this engine
 * can be put in. What is left is real and is what this asserts: the popup
 * follows the field when the field's width changes, and it never comes out
 * wider than the field. Forcing `inline-size: 500px` on the picker does
 * fail it.
 */
test("the select popup takes the width of the field, whatever it is", async ({
  page,
}) => {
  await openStory(page, "components-select--matrix");

  /* Scoped by our own class: a bare `select` would also match anything
     Storybook renders around the story. */
  const select = page.locator("select.uix-select").first();

  for (const width of [302, 420, 560]) {
    if (width !== 302) {
      await select.evaluate((node, px) => {
        (node as HTMLElement).style.inlineSize = `${px}px`;
      }, width);
    }

    const field = await select.boundingBox();
    await select.click();

    /* The option's own box, because `::picker(select)` has no node to
       measure. Its width is the picker's content box, so the difference
       from the field is exactly the picker's border and padding. */
    const option = await select.locator("option").first().boundingBox();
    expect(option, "the picker did not open").not.toBeNull();

    const inset = field!.width - option!.width;
    expect(
      inset,
      `field ${field!.width.toFixed(0)}px, option ${option!.width.toFixed(0)}px: ` +
        `the popup is not tracking the field`,
    ).toBeLessThanOrEqual(16);
    expect(inset, "the popup is wider than the field").toBeGreaterThanOrEqual(
      0,
    );

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
