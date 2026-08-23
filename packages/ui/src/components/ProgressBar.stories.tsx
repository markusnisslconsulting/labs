import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
  args: { label: "Uploading catalogue", value: 64 },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", {
      name: "Uploading catalogue",
    });
    await expect(bar).toHaveAttribute("aria-valuenow", "64");
  },
};

export const Indeterminate: Story = {
  args: { label: "Rebuilding the index" },
  play: async ({ canvas }) => {
    // No numbers for an unknown duration — the label is all a screen
    // reader needs.
    expect(canvas.queryByRole("progressbar")).toBeNull();
    await expect(canvas.getByText("Rebuilding the index")).toBeVisible();
  },
};
