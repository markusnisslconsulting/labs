import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj;

/** The trigger receives aria-describedby automatically. */
export const OnButton: Story = {
  render: () => (
    <Tooltip content="Applies to draft rows only">
      <button type="button">Bulk edit</button>
    </Tooltip>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Bulk edit" });
    await expect(trigger).toHaveAttribute(
      "aria-describedby",
      expect.any(String),
    );
    await expect(canvas.getByRole("tooltip")).toHaveTextContent(
      "Applies to draft rows only",
    );
  },
};

export const Below: Story = {
  render: () => (
    <Tooltip content="Undo walks through committing again" placement="bottom">
      <button type="button">What does undo do?</button>
    </Tooltip>
  ),
};
