import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchInput } from "./SearchInput";

const meta = {
  title: "Components/SearchInput",
  component: SearchInput,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  args: { placeholder: "Search the labs", "aria-label": "Search the labs" },
  play: async ({ canvas }) => {
    // The accessible name comes from the label, never the placeholder.
    await expect(
      canvas.getByRole("searchbox", { name: "Search the labs" }),
    ).toBeVisible();
  },
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  args: Default.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("searchbox")[0]!;
    await expect(target).toHaveFocus();
  },
};
