import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Divider } from "./Divider";

const meta = {
  title: "Components/Divider",
  component: Divider,
  tags: ["autodocs"],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  play: async ({ canvas }) => {
    // a separator is announced as one; it is not a styled empty div.
    await expect(canvas.getByRole("separator")).toBeVisible();
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", height: "3rem" }}>
      <span>Before</span>
      <Divider {...args} />
      <span>After</span>
    </div>
  ),
};
