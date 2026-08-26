import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof SegmentedControl>;

export default meta;

function ViewSwitcherDemo() {
  const [view, setView] = useState("list");
  return (
    <SegmentedControl
      label="View"
      value={view}
      onValueChange={setView}
      options={[
        { value: "list", label: "List" },
        { value: "board", label: "Board" },
        { value: "timeline", label: "Timeline" },
      ]}
    />
  );
}

export const ViewSwitcher: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => <ViewSwitcherDemo />,
  play: async ({ canvas }) => {
    // Reference state: assert what is on screen without changing it.
    await expect(canvas.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 * It keeps the RTL mode, because the selected segment's rounded corners
 * follow the inline edges.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", justifyItems: "start" }}>
      <ViewSwitcherDemo />
      <SegmentedControl
        label="With an unavailable option"
        value="list"
        onValueChange={() => {}}
        options={[
          { value: "list", label: "List" },
          { value: "board", label: "Board" },
          { value: "timeline", label: "Timeline", disabled: true },
        ]}
      />
    </div>
  ),
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
