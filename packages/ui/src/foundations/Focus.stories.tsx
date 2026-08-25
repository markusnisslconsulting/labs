import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/Button";

const meta = {
  title: "Foundations/Focus",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The focus ring exists only for keyboard focus (`focus-visible`), so
 * mouse clicks never draw it. Tab into the row and watch the ring
 * land on the first control.
 */
/**
 * This one keeps its snapshot deliberately: the focus ring after tabbing
 * IS the subject, so the post-play frame is the state worth baselining.
 */
export const KeyboardRing: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.8rem" }}>
      <Button>First</Button>
      <Button variant="outline">Second</Button>
      <Button variant="outline" size="sm">
        Third
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "First" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Second" })).toHaveFocus();
  },
};
