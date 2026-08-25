import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./Slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
export const ReorderBuffer: StoryObj<typeof meta> = {
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
