import { expect, userEvent } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch";

/**
 * Story policy, applied across the library:
 *
 * - Reference stories show a state and never change it. They are what
 *   the docs page documents and what Chromatic baselines.
 * - Interaction stories drive behaviour and are allowed to mutate. They
 *   opt out of snapshots, because Chromatic captures the frame AFTER
 *   play() resolves, so a mutating story silently baselines the state
 *   after the interaction rather than the state it is named for.
 *
 * This file is the reason the policy exists: `Off` used to click its own
 * label, so the off switch rendered, toggled itself on, and every human
 * and every snapshot saw an on switch called Off.
 */
const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: grouped(
    "label",
    "checked",
    "defaultChecked",
    "disabled",
    "onChange",
  ),
  args: { label: "Compact rows" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

export const On: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultChecked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};

export const Disabled: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { disabled: true, defaultChecked: true },
};

export const TogglesFromTheLabel: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const control = canvas.getByRole("switch");
    // The label text toggles too, so the whole row is the target.
    await userEvent.click(canvas.getByText("Compact rows"));
    await expect(control).toHaveAttribute("aria-checked", "true");
  },
};

export const TogglesWithTheKeyboard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const control = canvas.getByRole("switch");
    control.focus();
    await userEvent.keyboard(" ");
    await expect(control).toHaveAttribute("aria-checked", "true");
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
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
    </div>
  ),
};
