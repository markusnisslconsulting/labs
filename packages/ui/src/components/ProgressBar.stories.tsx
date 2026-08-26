import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs", "stable"],
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
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => <CyclingBar />,
};

export const Static64: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "Uploading catalogue", value: 64 },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", {
      name: "Uploading catalogue",
    });
    await expect(bar).toHaveAttribute("aria-valuenow", "64");
  },
};

export const Indeterminate: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
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
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <ProgressBar label="Empty" value={0} />
      <ProgressBar label="Part way" value={64} />
      <ProgressBar label="Complete" value={100} />
      <ProgressBar label="Indeterminate" />
    </div>
  ),
};
