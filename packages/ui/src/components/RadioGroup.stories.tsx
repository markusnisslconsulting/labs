import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
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
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShippingSpeed: Story = {};

/** Interaction only; see the note in Accordion.stories. */
export const SelectingAnOption: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText("Express (1-2 days)"));
    await expect(canvas.getByLabelText("Express (1-2 days)")).toBeChecked();
    await expect(
      canvas.getByLabelText("Standard (3-5 days)"),
    ).not.toBeChecked();
  },
};
