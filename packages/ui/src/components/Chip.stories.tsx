import { expect, fn, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";

const meta = {
  title: "Components/Chip",
  component: Chip,
  tags: ["autodocs"],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A plain label. Renders a span; nothing here is focusable. */
export const StaticTag: Story = {
  args: { children: "agentic-ui" },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** A filter. Native button with aria-pressed announcing the state. */
export const FilterOff: Story = {
  args: {
    interactive: true,
    active: false,
    children: "agents",
    onSelect: fn(),
  },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole("button", { name: "agents" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  },
};

export const FilterActive: Story = {
  args: { interactive: true, active: true, children: "agents", onSelect: fn() },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole("button", { name: "agents" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  },
};

/** Reachable from the keyboard. Interaction only, so it does not snapshot. */
export const KeyboardReachable: Story = {
  args: FilterOff.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button")).toHaveFocus();
  },
};
