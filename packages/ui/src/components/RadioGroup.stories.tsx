import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShippingSpeed: Story = {
  args: {
    name: "shipping",
    legend: "Shipping speed",
    defaultValue: "standard",
    options: [
      { value: "standard", label: "Standard (3-5 days)" },
      { value: "express", label: "Express (1-2 days)" },
      { value: "overnight", label: "Overnight" },
    ],
  },
  play: async ({ canvas }) => {
    // Arrow keys move selection inside the group, per the platform.
    await userEvent.click(canvas.getByLabelText("Express (1-2 days)"));
    await expect(canvas.getByLabelText("Express (1-2 days)")).toBeChecked();
    await expect(
      canvas.getByLabelText("Standard (3-5 days)"),
    ).not.toBeChecked();
  },
};
