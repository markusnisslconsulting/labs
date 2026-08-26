import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

const meta = {
  title: "Components/Menu",
  component: Menu,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj;

/**
 * Trigger wiring is asserted here. The lazy popup (items, keyboard,
 * typeahead-free menu navigation) is Base UI's own tested surface —
 * the headless runner's synthetic click does not reach it, the real
 * browser does.
 */
export const RowActions: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  args: {
    label: "Row actions",
    items: [
      { id: "duplicate", label: "Duplicate" },
      { id: "archive", label: "Archive" },
      { id: "delete", label: "Delete", danger: true },
    ],
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
  args: RowActions.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};

/** RowActionsBehaviour, asserted. Hidden: it renders the example above again. */
export const RowActionsBehaviour: Story = {
  tags: ["!dev"],
  args: RowActions.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Row actions/ });
    await expect(trigger).toHaveClass("uix-button");
    await expect(trigger).toBeVisible();
  },
};

/**
 * Open, which is the state worth looking at and the one the catalogue
 * could not show: Menu rendered `<Root>` with no props, so its open state
 * was unreachable and every picture of it was a closed button.
 */
export const Open: Story = {
  args: { ...RowActions.args, defaultOpen: true },
};

/**
 * Composed, with the structure `items` cannot express: a labelled group,
 * a separator, and a destructive action set apart from the rest.
 */
export const Structured: Story = {
  /* Photographed rather than Open: this is the frame that carries the
     group labels, the separators, the destructive item and the disabled
     one, and a disabled menu item had no picture at all — Menu accepted
     the prop and styled nothing, so "Export as PDF" and "Copy link" were
     the same row. */
  parameters: { chromatic: { disableSnapshot: false } },
  args: { label: "Order", defaultOpen: true, items: undefined },
  render: (args) => (
    <Menu {...args}>
      <Menu.Group>
        <Menu.GroupLabel>Change</Menu.GroupLabel>
        <Menu.Item>Edit quantities</Menu.Item>
        <Menu.Item>Change supplier</Menu.Item>
      </Menu.Group>
      <Menu.Separator />
      <Menu.Group>
        <Menu.GroupLabel>Share</Menu.GroupLabel>
        <Menu.Item>Copy link</Menu.Item>
        <Menu.Item disabled>Export as PDF</Menu.Item>
      </Menu.Group>
      <Menu.Separator />
      <Menu.Item danger>Cancel order</Menu.Item>
    </Menu>
  ),
};

/**
 * Every placement, so the four sides and three alignments are visible
 * rather than described. Placement is a prop because a popup flips on its
 * own only when it runs out of room, and a menu in a toolbar at the foot
 * of a page runs out of room every time.
 */
export const Placements: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "9rem 3rem",
        padding: "7rem 3rem",
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
        <Menu
          key={`${side}-${align}`}
          label={`${side} / ${align}`}
          side={side}
          align={align}
          defaultOpen
          items={[
            { id: "duplicate", label: "Duplicate" },
            { id: "archive", label: "Archive" },
          ]}
        />
      ))}
    </div>
  ),
};
