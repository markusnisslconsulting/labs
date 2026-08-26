import { expect } from "storybook/test";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
    await expect(
      canvas.getByRole("button", { name: "Page 4" }),
    ).toHaveAttribute("aria-current", "page");
  },
};

/** Interaction only: the current page moves, so it does not snapshot. */
export const MovingToTheNextPage: Story = {
  args: NinePages.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: "Next page" }).click();
    await expect(
      canvas.getByRole("button", { name: "Page 5" }),
    ).toHaveAttribute("aria-current", "page");
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
