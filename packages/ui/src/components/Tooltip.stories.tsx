import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "./Tooltip";
import { Button } from "./Button";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;

/** Open state rendered deterministically for the assertion. */
export const OnButton: StoryObj = {
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
  render: () => (
    <Tooltip content="Undo walks through committing again" placement="bottom">
      <Button variant="outline">What does undo do?</Button>
    </Tooltip>
  ),
};
