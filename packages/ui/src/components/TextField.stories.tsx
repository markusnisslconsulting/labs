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
    // Label, hint and input are wired: typing into the labelled field
    // is how we prove the for/id and describedby links exist.
    const input = canvas.getByLabelText("Order number");
    await userEvent.type(input, "4711");
    await expect(input).toHaveValue("4711");
    await expect(input).toHaveAccessibleDescription(/confirmation email/);
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
