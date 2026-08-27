import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj;

/**
 * Trigger wiring asserted; the lazy popup (title, body, close) is
 * Base UI's own tested surface — same policy as Menu and Tooltip.
 */
export const Details: Story = {
  /* Not photographed. The open popover carries everything a closed trigger would. */
  parameters: { chromatic: { disableSnapshot: true, modes: { ...RTL } } },
  args: {
    trigger: "Delivery details",
    title: "Nordwind Logistik",
    children: (
      <p>
        Windows update weekly. The negotiation agent drafts changes; a person
        commits them.
      </p>
    ),
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
  args: Details.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};

/** DetailsBehaviour, asserted. Hidden: it renders the example above again. */
export const DetailsBehaviour: Story = {
  tags: ["!dev"],
  args: Details.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Delivery details/ });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveClass("uix-button");
  },
};

/**
 * Open, for the same reason Menu needed it: the popup is the component,
 * and until `defaultOpen` was forwarded the catalogue could only show the
 * button in front of it.
 */
export const Open: Story = {
  /* The one photographed story: an open popover shows the popup, its
     title, its body and its close control in a single frame. */
  parameters: { chromatic: { disableSnapshot: false } },
  args: { ...Details.args, defaultOpen: true },
};

/**
 * Above the trigger, for a control near the bottom of a page. Placement
 * is a prop because the popup flips on its own only when it runs out of
 * room, and a footer control runs out of room every time.
 */
export const AboveTheTrigger: Story = {
  args: { ...Details.args, defaultOpen: true, side: "top", align: "start" },
  /* The trigger needs room above it or the popup flips back down, which
     is correct behaviour and a useless picture: the first version of this
     story put the trigger at the top of the canvas and rendered
     identically to the one above it. */
  decorators: [
    (Story) => (
      <div style={{ paddingBlockStart: "14rem" }}>
        <Story />
      </div>
    ),
  ],
};

/** Every placement, for the same reason Menu has one. */
export const Placements: StoryObj = {
  parameters: {
    /* Not photographed. Placement is exempted in the coverage script; see Menu. */
    chromatic: { disableSnapshot: true },
  },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "11rem 3rem",
        padding: "9rem 3rem",
      }}
    >
      {(
        [
          ["bottom", "start"],
          ["bottom", "center"],
          ["top", "end"],
          ["right", "start"],
          ["left", "center"],
        ] as const
      ).map(([side, align]) => (
        <Popover
          key={`${side}-${align}`}
          trigger={`${side} / ${align}`}
          title="Nordwind Logistik"
          side={side}
          align={align}
          defaultOpen
        >
          <p style={{ margin: 0 }}>Windows update weekly.</p>
        </Popover>
      ))}
    </div>
  ),
};
