import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./Accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs", "stable"],
  args: {
    items: [
      {
        id: "what",
        title: "What is pinned here?",
        body: <p>The logic packages and their transition tests.</p>,
      },
      {
        id: "why",
        title: "Why one panel open at a time?",
        body: <p>Focus stays on one answer; multiple is a prop away.</p>,
      },
    ],
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleOpen: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
};

/**
 * Interaction, not a reference state. Chromatic captures the frame after
 * play() resolves, so snapshotting this would baseline the post-click
 * state under a name that promises the initial one.
 */
export const OpeningOneClosesTheOther: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const second = canvas.getByRole("button", { name: /Why one panel/ });
    await userEvent.click(second);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByRole("button", { name: /What is pinned/ }),
    ).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};
