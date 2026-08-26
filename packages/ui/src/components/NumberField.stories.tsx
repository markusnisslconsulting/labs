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
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Reorder point",
    min: 0,
    max: 10_000,
    step: 10,
    defaultValue: 800,
  },
  play: async ({ canvas }) => {
    // Assertion only. This story used to click Increase while still
    // being snapshotted, so the baseline held 810 under a name that
    // promised 800 — the same trap Switch's Off story fell into.
    await expect(
      canvas.getByRole("textbox", { name: "Reorder point" }),
    ).toHaveValue("800");
  },
};

/** Interaction only: the value moves, so it does not snapshot. */
export const Stepping: Story = {
  args: ReorderPoint.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: /Increase/ }).click();
    await expect(
      canvas.getByRole("textbox", { name: "Reorder point" }),
    ).toHaveValue("810");
  },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <NumberField label="Rest" defaultValue={800} step={10} />
      <NumberField label="At the minimum" min={0} defaultValue={0} />
      <NumberField label="Disabled" defaultValue={800} disabled />
    </div>
  ),
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
