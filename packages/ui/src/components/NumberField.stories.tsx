import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberField } from "./NumberField";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  tags: ["autodocs", "beta"],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReorderPoint: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  args: {
    label: "Reorder point",
    min: 0,
    max: 10_000,
    step: 10,
    defaultValue: 800,
  },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: /Increase/ }).click();
    await expect(
      canvas.getByRole("textbox", { name: "Reorder point" }),
    ).toHaveValue("810");
  },
};

/** Reachable from the keyboard. Interaction only, so it does not snapshot. */
export const KeyboardReachable: Story = {
  args: ReorderPoint.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    // Base UI renders a text input with inputmode numeric rather than a
    // spinbutton, so the role to expect is textbox.
    await expect(canvas.getByRole("textbox")).toHaveFocus();
  },
};
