import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;

/** Open state rendered deterministically for the assertion. */
export const OnButton: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Tooltip content="Applies to draft rows only">
      <Button variant="outline">Bulk edit</Button>
    </Tooltip>
  ),
};

/** defaultOpen mounts the popup immediately — shown here so the
    styling is reviewable without a pointer. Interaction (hover,
    focus, Escape, edge flipping) is Base UI's own tested surface;
    the headless runner's synthetic hover does not reach it, so this
    suite asserts markup and styling only. */
export const OpenState: StoryObj = {
  render: () => (
    <Tooltip content="Applies to draft rows only" defaultOpen>
      <button type="button">Bulk edit</button>
    </Tooltip>
  ),
};

/** Placement below, for triggers near the top edge. */
export const Below: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Tooltip content="Undo walks through committing again" placement="bottom">
      <Button variant="outline">What does undo do?</Button>
    </Tooltip>
  ),
};

export const TriggerKeepsItsName: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Tooltip content="Days of stock remaining">
      <button type="button">Cover</button>
    </Tooltip>
  ),
  args: {
    content: "Days of stock remaining",
    children: <button>Cover</button>,
  },
  play: async ({ canvas }) => {
    // The tooltip describes the trigger; it must not replace its name.
    await expect(canvas.getByRole("button", { name: "Cover" })).toBeVisible();
  },
};
