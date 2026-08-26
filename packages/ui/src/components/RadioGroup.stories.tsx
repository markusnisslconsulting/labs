import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs", "stable"],
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

export const ShippingSpeed: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
};

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

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("radio")[0]!;
    await expect(target).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toBeDisabled();
    }
  },
};
