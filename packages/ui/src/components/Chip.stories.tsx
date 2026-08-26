import { expect, fn, userEvent } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";

const meta = {
  title: "Components/Chip",
  component: Chip,
  tags: ["autodocs", "stable"],
  argTypes: grouped("interactive", "active", "children", "onSelect"),
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A plain label. Renders a span; nothing here is focusable. */
export const StaticTag: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: "agentic-ui" },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** A filter. Native button with aria-pressed announcing the state. */
export const FilterOff: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
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
  parameters: { chromatic: { disableSnapshot: true } },
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
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.6rem",
        alignItems: "center",
      }}
    >
      <Chip>static tag</Chip>
      <Chip interactive onSelect={() => {}}>
        filter off
      </Chip>
      <Chip interactive active onSelect={() => {}}>
        filter on
      </Chip>
    </div>
  ),
};
