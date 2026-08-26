import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs", "stable"],
  argTypes: grouped(
    "label",
    "checked",
    "defaultChecked",
    "indeterminate",
    "disabled",
    "onChange",
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "Email me updates" },
};

export const Checked: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "Email me updates", defaultChecked: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("checkbox", { name: "Email me updates" }),
    ).toBeChecked();
  },
};

export const Indeterminate: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "Select all", indeterminate: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox", { name: "Select all" });
    // Base UI announces tri-state as aria-checked="mixed".
    await expect(box).toHaveAttribute("aria-checked", "mixed");
  },
};

export const Disabled: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
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

/**
 * Every state in one frame.
 *
 * This is the story Chromatic photographs; the per-state stories above
 * opt out, so one component costs one image per theme instead of one per
 * variant. They still run as tests — disabling a snapshot does not
 * disable a play function — and they still document each state on its own
 * in the docs page. A reviewer also sees every combination side by side,
 * which is easier to judge than five separate images.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="Disabled" disabled defaultChecked />
    </div>
  ),
};
