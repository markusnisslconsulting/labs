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
};

export const FilterActive: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { interactive: true, active: true, children: "agents", onSelect: fn() },
};

/** Reachable from the keyboard. Interaction only, so it does not snapshot. */
export const KeyboardReachable: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
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
      <Chip interactive onActiveChange={() => {}}>
        filter off
      </Chip>
      <Chip interactive active onActiveChange={() => {}}>
        filter on
      </Chip>
      {/* Chip never declared `disabled` — it spreads onto a <button>, so
          the attribute went straight through — and Chip.css has styled
          `button.uix-chip:disabled` since the component existed. A state
          that is reachable and styled and has no picture is a state
          nobody can check. */}
      <Chip interactive disabled onActiveChange={() => {}}>
        filter unavailable
      </Chip>
    </div>
  ),
};

/** FilterActive, asserted. Hidden: it renders the example above again. */
export const FilterActiveBehaviour: Story = {
  tags: ["!dev"],
  args: FilterActive.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole("button", { name: "agents" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  },
};

/** FilterOff, asserted. Hidden: it renders the example above again. */
export const FilterOffBehaviour: Story = {
  tags: ["!dev"],
  args: FilterOff.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole("button", { name: "agents" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  },
};

/** StaticTag, asserted. Hidden: it renders the example above again. */
export const StaticTagBehaviour: Story = {
  tags: ["!dev"],
  args: StaticTag.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
