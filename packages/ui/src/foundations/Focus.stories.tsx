import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/Button";
import { Cluster } from "../components/Cluster";

const meta = {
  title: "Foundations/Focus",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  render: () => (
    <Cluster gap="sm">
      <Button>First</Button>
      <Button variant="outline">Second</Button>
      <Button variant="outline" size="sm">
        Third
      </Button>
    </Cluster>
  ),
};

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
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: false } },
  render: Preview.render,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "First" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Second" })).toHaveFocus();
  },
};
