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
  parameters: { chromatic: { disableSnapshot: true } },
  args: { placeholder: "Search the labs", "aria-label": "Search the labs" },
  play: async ({ canvas }) => {
    // The accessible name comes from the label, never the placeholder.
    await expect(
      canvas.getByRole("searchbox", { name: "Search the labs" }),
    ).toBeVisible();
  },
};

/**
 * Every state in one frame. This is the component's snapshotted story:
 * one image per theme covers rest, filled and disabled, where three
 * separate stories would have cost three.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <SearchInput aria-label="Rest" placeholder="Search the labs" />
      <SearchInput aria-label="Filled" defaultValue="reorder point" />
      <SearchInput aria-label="Disabled" placeholder="Unavailable" disabled />
    </div>
  ),
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
