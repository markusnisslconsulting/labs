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

import { useEffect, useState } from "react";

function CyclingBar() {
  const [value, setValue] = useState(10);
  useEffect(() => {
    const timer = setInterval(() => {
      setValue((v) => (v >= 100 ? 10 : v + 10));
    }, 600);
    return () => clearInterval(timer);
  }, []);
  return <ProgressBar label="Uploading catalogue" value={value} />;
}

/** The fill animates via transform; this story cycles the value so
    the transition is visible instead of a frozen frame. */
export const Determinate: StoryObj = {
  render: () => <CyclingBar />,
};

export const Static64: Story = {
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
    const bar = canvas.getByRole("progressbar", {
      name: "Rebuilding the index",
    });
    await expect(bar).not.toHaveAttribute("aria-valuenow");
    await expect(canvas.getByText("Rebuilding the index")).toBeVisible();
  },
};
