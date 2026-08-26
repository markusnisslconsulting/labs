import { expect } from "storybook/test";
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
