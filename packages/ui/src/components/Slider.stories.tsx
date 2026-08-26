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
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
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
