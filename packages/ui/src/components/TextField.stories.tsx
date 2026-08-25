import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextField } from "./TextField";

const meta = {
  title: "Components/TextField",
  component: TextField,
  tags: ["autodocs"],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Order number",
    placeholder: "4711",
    hint: "Find it in your confirmation email.",
  },
  play: async ({ canvas }) => {
    // Assertions only, so the reference state stays empty: the hint is
    // linked whether or not anyone has typed.
    await expect(
      canvas.getByLabelText("Order number"),
    ).toHaveAccessibleDescription(/confirmation email/);
  },
};

/**
 * Interaction, not a reference state, so it does not snapshot: typing is
 * how the for/id link is proven, and a filled field is not the state the
 * name Default promises.
 */
export const TypingIntoTheLabelledField: Story = {
  args: { label: "Order number", hint: "Find it in your confirmation email." },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Order number");
    await userEvent.type(input, "4711");
    await expect(input).toHaveValue("4711");
  },
};

export const WithError: Story = {
  args: {
    label: "Order number",
    error: "We could not find that order number.",
    invalid: true,
  } as never,
};

export const WithPrefixAndSuffix: Story = {
  args: {
    label: "Reorder point",
    prefix: ">=",
    suffix: "units",
    defaultValue: 1240,
  },
};
