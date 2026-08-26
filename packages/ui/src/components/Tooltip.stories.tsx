import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs", "stable"],
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
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    // Both placements, because this is the only photographed story and a
    // placement nothing baselines is a placement nobody reviews. Spaced
    // so the two popups cannot overlap each other.
    <div style={{ display: "grid", gap: "5rem", justifyItems: "start" }}>
      <Tooltip content="Applies to draft rows only" defaultOpen>
        <Button variant="outline">Bulk edit</Button>
      </Tooltip>
      <Tooltip
        content="Undo walks through committing again"
        placement="bottom"
        defaultOpen
      >
        <Button variant="outline">What does undo do?</Button>
      </Tooltip>
    </div>
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
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Tooltip content="Days of stock remaining">
      <Button variant="outline">Cover</Button>
    </Tooltip>
  ),
  play: async ({ canvas }) => {
    // The tooltip describes the trigger; it must not replace its name.
    await expect(canvas.getByRole("button", { name: "Cover" })).toBeVisible();
  },
};
