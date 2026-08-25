import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberField } from "./NumberField";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReorderPoint: Story = {
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
