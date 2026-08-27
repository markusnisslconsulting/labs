import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cog, Download, Filter } from "lucide-react";

import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { SplitButton } from "./SplitButton";
import { Toolbar } from "./Toolbar";

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both orientations, with groups and separators.
 *
 * The separator is a hairline of border rather than a 1px-wide element with
 * a background: a 1px box disappears at some fractional device pixel
 * ratios, and a border does not. It is `aria-hidden` and carries no role,
 * because announcing "separator" interrupts a reader walking the controls
 * without telling them anything they can act on.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "2rem", justifyItems: "start" }}>
      <Toolbar label="Table actions">
        <Button>Export</Button>
        <Button variant="outline">Archive</Button>
        <Toolbar.Separator />
        <Toolbar.Group>
          <IconButton label="Filter">
            <Filter size={16} />
          </IconButton>
          <IconButton label="Download">
            <Download size={16} />
          </IconButton>
        </Toolbar.Group>
        <Toolbar.Separator />
        <IconButton label="Settings">
          <Cog size={16} />
        </IconButton>
      </Toolbar>

      <Toolbar label="Table actions, with a disabled control">
        <Button>Export</Button>
        <Button disabled>Archive</Button>
        <Toolbar.Separator />
        <SplitButton
          label="Save"
          menuLabel="More save options"
          items={[{ id: "draft", label: "Save as draft" }]}
        />
      </Toolbar>

      <Toolbar label="Editor actions" orientation="vertical">
        <IconButton label="Filter">
          <Filter size={16} />
        </IconButton>
        <IconButton label="Download">
          <Download size={16} />
        </IconButton>
        <Toolbar.Separator />
        <IconButton label="Settings">
          <Cog size={16} />
        </IconButton>
      </Toolbar>
    </div>
  ),
};

/**
 * One tab stop for the whole group.
 *
 * The entire reason to reach for this instead of a `div` with a gap. Five
 * controls in a row are five tab stops on the way to the content below
 * them; a toolbar is one, and the arrows move between the controls inside
 * it.
 *
 * Asserted by tabbing *past* the toolbar and landing on what follows it,
 * because that is the property a person feels. Counting `tabindex="-1"`
 * attributes would pass against a ring that never moves focus anywhere.
 */
export const OneTabStopForTheGroup: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", children: null },
  render: () => (
    <>
      <Toolbar label="Table actions">
        <Button>Export</Button>
        <Button variant="outline">Archive</Button>
        <IconButton label="Settings">
          <Cog size={16} />
        </IconButton>
      </Toolbar>
      <Button>After the toolbar</Button>
    </>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Export" }),
      "the first control is the group's single stop",
    ).toHaveFocus();

    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "After the toolbar" }),
      "Tab stopped inside the toolbar, so it is three stops rather than one",
    ).toHaveFocus();
  },
};

/**
 * The ring is read from the DOM, so a disabled control drops out of it.
 *
 * Not from a prop and not memoised. A toolbar's children are arbitrary: one
 * `SplitButton` contributes two controls, a conditional control appears and
 * disappears, and a disabled one has to leave the ring. Any list built
 * ahead of time disagrees with the screen eventually, and the disagreement
 * shows up as an arrow key that moves focus nowhere.
 *
 * Arrow keys themselves are asserted in `browser/keyboard.spec.ts` with
 * trusted events — this checks the membership question, which is what the
 * DOM query decides.
 */
export const DisabledControlsLeaveTheRing: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", children: null },
  render: () => (
    <Toolbar label="Table actions">
      <Button>Export</Button>
      <Button disabled>Archive</Button>
      <IconButton label="Settings">
        <Cog size={16} />
      </IconButton>
    </Toolbar>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();

    const enabled = ["Export", "Settings"];
    for (const name of enabled) {
      await expect(canvas.getByRole("button", { name })).toHaveAttribute(
        "tabindex",
      );
    }

    /* The disabled one is untouched: it is already unreachable, and giving
       it a tabindex would be a claim about a control that cannot take
       focus. */
    await expect(
      canvas.getByRole("button", { name: "Archive" }),
      "a disabled control was given a tabindex, so it is in the ring",
    ).not.toHaveAttribute("tabindex");
  },
};

/**
 * A vertical toolbar, which is what a narrow layout wants.
 *
 * `aria-orientation` is set only for vertical, because horizontal is the
 * role's default and repeating a default is noise a reader has to listen
 * through. The arrow keys follow: up and down rather than left and right,
 * asserted in `browser/keyboard.spec.ts` with trusted events.
 */
export const Vertical: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", children: null },
  render: () => (
    <Toolbar label="Editor actions" orientation="vertical">
      <IconButton label="Filter">
        <Filter size={16} />
      </IconButton>
      <IconButton label="Download">
        <Download size={16} />
      </IconButton>
      <Toolbar.Separator />
      <IconButton label="Settings">
        <Cog size={16} />
      </IconButton>
    </Toolbar>
  ),
};
