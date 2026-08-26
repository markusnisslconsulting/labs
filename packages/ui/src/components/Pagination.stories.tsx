import { expect, userEvent } from "storybook/test";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LabsStrings } from "../i18n";
import { Pagination } from "./Pagination";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NinePages: Story = {
  parameters: {
    chromatic: { disableSnapshot: false, modes: { ...NARROW_AND_RTL } },
  },
  args: { pageCount: 9, defaultPage: 4 },
  play: async ({ canvas }) => {
    // Assertion only: aria-current marks where you are. Clicking Next
    // here used to move the page while this story was still the
    // snapshotted one, so the baseline showed page 5 under a name and
    // args that both said page 4.
    //
    // getByLabelText, not getByRole: this story also renders in the
    // narrow mode, where the numbered buttons are display:none and so
    // absent from the accessibility tree that getByRole searches. The
    // label query reads the DOM, so the assertion holds at both widths.
    await expect(canvas.getByLabelText("Page 4")).toHaveAttribute(
      "aria-current",
      "page",
    );
    // What a narrow viewer gets instead of the numbers.
    await expect(canvas.getByText("Page 4 of 9")).toBeInTheDocument();
  },
};

/** Interaction only: the current page moves, so it does not snapshot. */
export const MovingToTheNextPage: Story = {
  args: NinePages.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: "Next page" }).click();
    await expect(canvas.getByLabelText("Page 5")).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const FirstPage: Story = {
  args: { pageCount: 3 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
  },
};

/**
 * The same component under a different locale.
 *
 * Nothing about Pagination changed: the provider supplies the strings and
 * the component reads them. Partial on purpose — this locale translates
 * four keys and inherits the rest, so adding a key upstream cannot break
 * a consumer who translated the ones that existed.
 */
export const Localized: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <LabsStrings
      strings={{
        pagination: "Seitennummerierung",
        previousPage: "Vorherige Seite",
        nextPage: "Nächste Seite",
        page: (n) => `Seite ${n}`,
      }}
    >
      <Pagination pageCount={9} defaultPage={4} />
    </LabsStrings>
  ),
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot.
 */
export const KeyboardReachable: Story = {
  args: NinePages.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    // The first stop is Previous, which is disabled on page 4? No — page 4
    // has a previous page, so it is the first reachable control.
    const first = canvas.getByRole("button", { name: "Previous page" });
    await expect(first).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByLabelText("Page 3")).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

/**
 * The counts that used to break it.
 *
 * `pageCount={1}` rendered page 1 twice — two buttons with the same
 * accessible name, both carrying `aria-current="page"`, and two React
 * children with the same key. `pageCount={0}` rendered a button labelled
 * "Page 0". A single-page result set is not an edge case; it is what a
 * filter returns most afternoons.
 */
export const SmallCounts: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", justifyItems: "start" }}>
      {/* Each landmark is named distinctly. Four navigations called
          "Pagination" is axe's landmark-unique violation, and it is not a
          story artefact: a long table has a pagination above it and
          another below. */}
      <Pagination pageCount={0} label="No results" />
      <Pagination pageCount={1} label="One page" />
      <Pagination pageCount={2} label="Two pages" />
      <Pagination pageCount={3} defaultPage={2} label="Three pages" />
    </div>
  ),
  play: async ({ canvas }) => {
    // Exactly one page-1 button per pagination, and no page 0 anywhere.
    await expect(canvas.queryAllByLabelText("Page 0")).toHaveLength(0);
    await expect(canvas.queryAllByLabelText("Page 1")).toHaveLength(4);
    // Each pagination states where it is, and each says a sensible total.
    // A count of aria-current buttons would be the direct assertion, but
    // neither filtering the canvas's proxied elements by attribute nor the
    // role query's `current` option matched inside the instrumented
    // canvas — so this asserts the summary, which is the same fact stated
    // where a narrow reader gets it.
    // Two of them: pageCount 0 and pageCount 1 both clamp to a single
    // page, which is the fix stating itself.
    await expect(canvas.getAllByText("Page 1 of 1")).toHaveLength(2);
    await expect(canvas.getByText("Page 1 of 2")).toBeVisible();
    await expect(canvas.getByText("Page 2 of 3")).toBeVisible();
  },
};
