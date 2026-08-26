import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./Accordion";
import { StatusPill } from "./StatusPill";

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

/** One at a time: opening a section closes the one before it. */
export const SingleOpen: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  args: { defaultValue: ["what"] },
};

/**
 * Several sections open at once, for a panel someone reads side by side
 * rather than one answer at a time.
 *
 * This story exists because the three that used to be here were the same
 * picture: two closed rows, three times over, differing only in which
 * interaction test had run behind them. `multiple` is a real branch in
 * the component and it had no example — so the one prop worth knowing
 * about was the one the catalogue did not show.
 */
export const SeveralOpen: Story = {
  args: { multiple: true, defaultValue: ["what", "why"] },
};

/** Composed, for a heading that carries more than text. */
export const ComposedSections: Story = {
  args: { items: undefined },
  render: () => (
    <Accordion>
      <Accordion.Item value="stock">
        <Accordion.Trigger>
          Stock levels <StatusPill tone="warn">3 low</StatusPill>
        </Accordion.Trigger>
        <Accordion.Panel>
          <p style={{ margin: 0 }}>
            Three lines are under their reorder point.
          </p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="suppliers">
        <Accordion.Trigger>
          Suppliers <StatusPill tone="ok">All reachable</StatusPill>
        </Accordion.Trigger>
        <Accordion.Panel>
          <p style={{ margin: 0 }}>Last sync completed at 04:12.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
};

/**
 * Interaction, not a reference state. Chromatic captures the frame after
 * play() resolves, so snapshotting this would baseline the post-click
 * state under a name that promises the initial one.
 */
export const OpeningOneClosesTheOther: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
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
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};
