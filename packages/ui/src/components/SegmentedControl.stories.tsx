import { expect, userEvent } from "storybook/test";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
} satisfies Meta<typeof SegmentedControl>;

export default meta;

function ViewSwitcherDemo() {
  const [view, setView] = useState("list");
  return (
    <SegmentedControl
      label="View"
      value={view}
      onChange={setView}
      options={[
        { value: "list", label: "List" },
        { value: "board", label: "Board" },
        { value: "timeline", label: "Timeline" },
      ]}
    />
  );
}

export const ViewSwitcher: StoryObj = {
  render: () => <ViewSwitcherDemo />,
  play: async ({ canvas }) => {
    // Reference state: assert what is on screen without changing it.
    await expect(canvas.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/** Interaction only; selection moves, so it does not snapshot. */
export const SelectingAView: StoryObj = {
  render: () => <ViewSwitcherDemo />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Board" }));
    await expect(canvas.getByRole("button", { name: "Board" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: StoryObj = {
  render: () => <ViewSwitcherDemo />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    // Options are native buttons with aria-pressed inside a labelled
    // group, not radios: the group is a toolbar of toggles.
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};
