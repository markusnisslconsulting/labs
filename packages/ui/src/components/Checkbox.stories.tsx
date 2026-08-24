import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { label: "Email me updates" },
};

export const Checked: Story = {
  args: { label: "Email me updates", defaultChecked: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("checkbox", { name: "Email me updates" }),
    ).toBeChecked();
  },
};

export const Indeterminate: Story = {
  args: { label: "Select all", indeterminate: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox", { name: "Select all" });
    // Base UI announces tri-state as aria-checked="mixed".
    await expect(box).toHaveAttribute("aria-checked", "mixed");
  },
};

export const Disabled: Story = {
  args: { label: "Email me updates", disabled: true },
};
