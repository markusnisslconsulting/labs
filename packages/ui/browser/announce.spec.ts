/**
 * What a screen reader is given, asserted.
 *
 * I claimed a screen reader could not be tested here and that the matrix
 * had to be manual. That was wrong, and Markus said so. Three layers are
 * automatable and only the third needs a person:
 *
 *   1. **The accessible name, description, role and state per node.**
 *      Playwright computes these to the AccName spec in a real browser —
 *      `toHaveAccessibleName`, `toHaveAccessibleDescription`, `getByRole`.
 *      This is exactly the string a reader speaks for a node. No new
 *      dependency, and it found a defect on its first run.
 *   2. **The accessibility tree in reading order.** `ariaSnapshot()`
 *      returns the tree a reader walks, as text. Order, nesting and state
 *      are all in it, which per-node assertions cannot see.
 *   3. **Real assistive technology.** NVDA and VoiceOver can be driven
 *      from Node by Guidepup, which captures the spoken phrase log. That
 *      one genuinely needs a Windows or macOS runner and, on a
 *      developer's machine, permission to turn VoiceOver on — so it stays
 *      in the manual matrix, and the matrix now says what these two
 *      layers already cover so its rows are about what only real AT can
 *      show: verbosity, punctuation, and the differences between readers.
 *
 * What layer 1 found immediately: every required field announced its
 * state twice. `required` was set on the control — which every reader
 * announces — and the word "required" was also appended to the label, so
 * the computed name came out "Required required". axe reports nothing:
 * there is nothing invalid about it.
 */
import { test, expect } from "@playwright/test";
import { openStory } from "./ready";

/* ------------------------------------------------------------ the names */

test("a required field says so once, not twice", async ({ page }) => {
  await openStory(page, "components-textfield--matrix");

  const required = page.getByRole("textbox", { name: /^Required/ });

  /* The state is on the control, where a reader reads it from. */
  await expect(
    required,
    "the control is not programmatically required, so only the asterisk " +
      "carries it and the asterisk is aria-hidden",
  ).toHaveAttribute("required", "");

  /* And the computed name says it none times rather than twice. The
     asterisk is aria-hidden so it never appears here — asserting on the
     label's textContent instead would have to strip it, which is a hint
     that textContent is the wrong thing to read. What a reader gets is
     the accessible name, so that is what this reads. */
  await expect(
    required,
    "the accessible name repeats a state the control already carries, so a " +
      'reader says "required" twice in one field',
  ).toHaveAccessibleName(/^(?!.*required.*required).*$/i);
});

test("a field's hint and error reach it as a description", async ({ page }) => {
  await openStory(page, "components-field--matrix");

  const both = page.getByRole("textbox", {
    name: /Required, hinted and failing/,
  });
  await expect(
    both,
    "a reader gets the instruction and the complaint, in that order",
  ).toHaveAccessibleDescription(/One line of guidance.*not accepted/s);
  await expect(both).toHaveAttribute("aria-invalid", "true");
});

test("an icon-only control has a name that is not its glyph", async ({
  page,
}) => {
  await openStory(page, "components-iconbutton--matrix");
  const buttons = page.getByRole("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const name = await buttons
      .nth(i)
      .evaluate(
        (el) => el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "",
      );
    expect(
      name.length,
      `icon button ${i} has no accessible name, so a reader announces ` +
        `"button" and nothing else`,
    ).toBeGreaterThan(1);
  }
});

/* -------------------------------------------------- the tree, in order */

/**
 * The reading order of a field, as a tree rather than as nodes.
 *
 * Per-node assertions cannot see order or nesting. This can: the label
 * comes before the control, the hint before the error, and the state is
 * on the control rather than floating beside it. A regression that moves
 * an error above its field, or drops it out of the tree, shows up here
 * and nowhere else in this repository.
 */
test("a field reads label, control, hint, error", async ({ page }) => {
  await openStory(page, "components-field--matrix");

  const tree = await page.locator("#storybook-root").ariaSnapshot();
  const lines = tree
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  /* Scoped to the row being examined, not to the whole matrix.
     The first version searched the entire tree, and the matrix has six
     fields — "One line of guidance" appears twice, so findIndex returned
     the hint belonging to a different row and the test reported the hint
     reading before the control. A test that measures the wrong row is
     indistinguishable from a component that orders the wrong row. */
  const from = (pattern: RegExp, after = -1) =>
    lines.findIndex((line, index) => index > after && pattern.test(line));

  const label = from(/text: Required, hinted and failing/);
  const control = from(
    /textbox "Required, hinted and failing".*invalid/,
    label,
  );
  const hint = from(/paragraph: One line of guidance/, control);
  const error = from(/paragraph: That value is not accepted/, control);

  expect(label, "the label is not in the accessibility tree").toBeGreaterThan(
    -1,
  );
  expect(control, "the control is not in the tree as invalid").toBeGreaterThan(
    label,
  );
  expect(hint, "the hint reads before the control").toBeGreaterThan(control);
  expect(
    error,
    "the error reads before the hint; a reader gets the complaint before " +
      "the instruction",
  ).toBeGreaterThan(hint);
});

/**
 * A dialog is announced as a dialog, with a name.
 *
 * The modal semantics of this component are ours rather than Base UI's —
 * measured against `1.0.0-rc.0` the popup had `role="dialog"` and nothing
 * else. This is the assertion that would have caught that from the
 * reader's side.
 */
test("a modal is announced as a named, modal dialog", async ({ page }) => {
  await openStory(page, "components-dialog--open-with-page-behind");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(
    dialog,
    "the dialog has no accessible name, so a reader announces 'dialog'",
  ).toHaveAccessibleName(/Edit reorder point/);
  await expect(dialog).toHaveAccessibleDescription(/SKU 4711/);
});

/**
 * The page behind a modal is gone from the tree, not merely covered.
 *
 * The scrim is the sighted half of that promise and `inert` is the other.
 * A reader that can still walk the page behind a modal has not been told
 * the page is unreachable, however dark the scrim is.
 */
test("the page behind a modal is out of the accessibility tree", async ({
  page,
}) => {
  await openStory(page, "components-dialog--open-with-page-behind");
  await expect(page.getByRole("dialog")).toBeVisible();

  const reachable = await page.evaluate(() => {
    const behind = document.querySelector(".uix-button:not(.uix-dialog *)");
    if (!behind) return "no button behind the modal in this story";
    // inert removes a subtree from the accessibility tree entirely.
    let node: Element | null = behind;
    while (node) {
      if (node.hasAttribute("inert")) return "inert";
      node = node.parentElement;
    }
    return "reachable";
  });

  expect(
    reachable,
    "the button behind the modal is still in the accessibility tree, so a " +
      "reader can operate the page the dialog is covering",
  ).toBe("inert");
});

/* ------------------------------------------------- how often it is said */

/**
 * The error summary is written to once, not twice.
 *
 * A live region is announced when its content changes, so a region that
 * renders wrong-then-right is a region announced twice. This library's own
 * screen-reader checklist tells a tester to listen for exactly that on
 * `Toaster`; `Form.Summary` had it, and no assertion here could see it,
 * because both writes end at the same correct final state.
 *
 * The cause was structural rather than a slip. Fields register themselves
 * in an effect, so on the first render no error has an owner yet — and the
 * summary's fallback for an error whose field the form does not render
 * could not tell "unclaimed yet" from "unclaimed for good". So a form
 * handed server errors rendered the message as plain text, then replaced
 * it with a link.
 *
 * Counted from before the page's own scripts run, because the writes happen
 * during the first paint and nothing sampled afterwards can see them. The
 * observer watches `document` rather than `document.documentElement`: an
 * init script runs before the document element exists, so the first version
 * of this test observed `null`, counted nothing, and passed against both the
 * broken and the fixed component. It was measured before it was trusted.
 *
 * Measured on the story below, with and without the fix: **1 write against
 * 5**, and the first of those five read "3 fields need attention" followed
 * by three messages with no field names on them at all, because at that
 * point no field had registered and every error took the orphan branch.
 */
test("the error summary is written to once", async ({ page }) => {
  await page.addInitScript(() => {
    const store = window as unknown as Record<string, unknown>;
    store.__alertWrites = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as Element;
        const inside =
          target.nodeType === 1
            ? target.closest("[role=alert]")
            : target.parentElement?.closest("[role=alert]");
        const inserted = [...record.addedNodes].some(
          (node) =>
            node.nodeType === 1 &&
            ((node as Element).getAttribute?.("role") === "alert" ||
              (node as Element).querySelector?.("[role=alert]")),
        );
        if (inside || inserted)
          store.__alertWrites = (store.__alertWrites as number) + 1;
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });

  /* The matrix, whose middle form is handed errors it already has under
     `summaryOn="always"`. That is the only shape where this is visible:
     the summary has to render during the first paint, and it has to hold
     errors belonging to fields that do register — an error with no field
     at all reads the same in both passes, so the first story tried here
     could not tell the versions apart. */
  await openStory(page, "components-form--matrix");
  await expect(page.getByRole("alert")).toBeVisible();

  const writes = await page.evaluate(
    () => (window as unknown as Record<string, unknown>).__alertWrites,
  );
  expect(
    writes,
    "the summary was written to more than once, so a screen reader " +
      "announces it more than once",
  ).toBeLessThanOrEqual(1);
});
