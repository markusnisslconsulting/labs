import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Divider } from "./Divider";

const meta = {
  title: "Components/Divider",
  component: Divider,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { orientation: "horizontal" },
  play: async ({ canvas }) => {
    // a separator is announced as one; it is not a styled empty div.
    await expect(canvas.getByRole("separator")).toBeVisible();
  },
};

export const Vertical: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", height: "3rem" }}>
      <span>Before</span>
      <Divider {...args} />
      <span>After</span>
    </div>
  ),
};

/**
 * Every state in one frame.
 *
 * This is the story Chromatic photographs; the per-state stories above
 * opt out, so one component costs one image per theme instead of one per
 * variant. They still run as tests — disabling a snapshot does not
 * disable a play function — and they still document each state on its own
 * in the docs page. A reviewer also sees every combination side by side,
 * which is easier to judge than five separate images.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Divider orientation="horizontal" />
      <div style={{ display: "flex", alignItems: "center", height: "3rem" }}>
        <span>Before</span>
        <Divider orientation="vertical" />
        <span>After</span>
      </div>
    </div>
  ),
};
