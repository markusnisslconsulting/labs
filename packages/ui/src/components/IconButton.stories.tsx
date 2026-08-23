import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  tags: ["autodocs"],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name is required at the type level — an unlabelled icon
    button cannot be authored. */
export const Close: Story = {
  args: { label: "Close", children: "✕" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Close" })).toBeVisible();
  },
};

export const Solid: Story = {
  args: { label: "Settings", variant: "solid", children: "⚙" },
};
