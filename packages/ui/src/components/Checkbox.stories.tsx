import { expect, userEvent } from "storybook/test";
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

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  args: Unchecked.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("checkbox")[0]!;
    await expect(target).toHaveFocus();
  },
};
