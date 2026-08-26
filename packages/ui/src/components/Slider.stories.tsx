import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./Slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs", "beta"],
} satisfies Meta<typeof Slider>;

export default meta;
export const ReorderBuffer: StoryObj<typeof meta> = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Safety buffer",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 20,
  },
  play: async ({ canvas }) => {
    const slider = canvas.getByRole("slider", { name: "Safety buffer" });
    await expect(slider).toHaveValue("20");
  },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 * It carries the RTL mode, because the fill direction of a range input
 * is exactly what flips with the writing direction.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <Slider label="Rest" defaultValue={20} />
      <Slider label="At the maximum" defaultValue={100} />
      <Slider label="Without the value" defaultValue={40} showValue={false} />
      <Slider label="Disabled" defaultValue={20} disabled />
    </div>
  ),
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: StoryObj = {
  args: ReorderBuffer.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("slider")[0]!;
    await expect(target).toHaveFocus();
  },
};
