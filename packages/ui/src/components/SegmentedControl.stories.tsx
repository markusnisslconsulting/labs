import { expect } from "storybook/test";
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
    await canvas.getByRole("button", { name: "Board" }).click();
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
