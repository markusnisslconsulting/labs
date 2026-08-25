import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings, X } from "lucide-react";
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
  args: { label: "Close", children: <X size={14} /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Close" })).toBeVisible();
  },
};

export const Solid: Story = {
  args: {
    label: "Settings",
    variant: "solid",
    children: <Settings size={14} />,
  },
};
