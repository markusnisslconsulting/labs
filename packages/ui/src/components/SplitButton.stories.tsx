import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SplitButton } from "./SplitButton";

const meta = {
  title: "Components/SplitButton",
  component: SplitButton,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { id: "close", label: "Save and close" },
  { id: "draft", label: "Save as draft" },
  { id: "discard", label: "Discard changes", danger: true },
];

/**
 * Every state and every axis, in one frame.
 *
 * The seam is the thing to look at. It is drawn in `currentColor` at low
 * alpha rather than in a border token, because the line sits *inside* one
 * control and has to darken whatever fill the variant chose — a fixed
 * colour disappears on the solid variant in one theme and shouts on the
 * outline variant in the other.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
      <SplitButton label="Save" menuLabel="More save options" items={OPTIONS} />
      <SplitButton
        label="Save"
        menuLabel="More save options"
        items={OPTIONS}
        variant="outline"
      />
      <SplitButton
        label="Save"
        menuLabel="More save options"
        items={OPTIONS}
        tone="neutral"
      />
      <SplitButton
        label="Save"
        menuLabel="More save options"
        items={OPTIONS}
        size="sm"
      />
      <SplitButton
        label="Save"
        menuLabel="More save options"
        items={OPTIONS}
        size="lg"
      />
      <SplitButton
        label="Save"
        menuLabel="More save options"
        items={OPTIONS}
        disabled
      />
      <SplitButton
        label="Saving"
        menuLabel="More save options"
        items={OPTIONS}
        loading
      />
    </div>
  ),
};

/**
 * Two buttons, each with its own name, each reachable.
 *
 * The claim the component exists for. A single button that opened a menu
 * when clicked on its right-hand side would be one control announcing one
 * name and doing two things, and a keyboard could only ever reach one of
 * them.
 *
 * `menuLabel` is required for the same reason. The arrow is icon-only, so
 * its accessible name has to come from a prop — and "More" is useless on a
 * page with three split buttons, which is why the type asks for something
 * specific rather than defaulting.
 */
export const BothHalvesAreRealButtons: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", menuLabel: "" },
  render: function Render() {
    const [done, setDone] = useState<string[]>([]);
    return (
      <>
        <SplitButton
          label="Save"
          menuLabel="More save options"
          onAction={() => setDone((current) => [...current, "primary"])}
          items={OPTIONS.map((option) => ({
            ...option,
            onSelect: () => setDone((current) => [...current, option.id]),
          }))}
        />
        <p data-testid="done">{done.join(",")}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const primary = canvas.getByRole("button", { name: "Save" });
    const more = canvas.getByRole("button", { name: "More save options" });

    await expect(
      more,
      "the arrow is icon-only, so its name has to come from menuLabel",
    ).toHaveAccessibleName("More save options");
    await expect(more).toHaveAttribute("aria-haspopup", "menu");

    // The group ties them together for a reader.
    await expect(canvas.getByRole("group")).toBeInTheDocument();

    await userEvent.click(primary);
    await expect(canvas.getByTestId("done")).toHaveTextContent("primary");

    /* And the arrow does its own thing rather than the primary action —
       which is what a one-button implementation gets wrong.

       Queried from the document rather than from the canvas: the popup is
       portalled, so it is not inside the story root at all. A `canvas`
       query here fails with "unable to find role" and reads as a broken
       menu rather than as a query looking in the wrong tree. */
    await userEvent.click(more);
    const item = await within(document.body).findByRole("menuitem", {
      name: "Save as draft",
    });
    await userEvent.click(item);
    await expect(canvas.getByTestId("done")).toHaveTextContent("primary,draft");
  },
};

/**
 * Tab reaches both halves, in the reading order.
 *
 * `Menu`'s own keyboard behaviour is Base UI's and is asserted in
 * `browser/keyboard.spec.ts` with trusted keys. What is asserted here is
 * the part this component adds: that there are two stops and not one.
 */
export const TabReachesBothHalves: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", menuLabel: "" },
  render: () => (
    <SplitButton label="Save" menuLabel="More save options" items={OPTIONS} />
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Save" })).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "More save options" }),
      "the arrow is not a tab stop, so a keyboard cannot reach the menu",
    ).toHaveFocus();
  },
};

/**
 * Disabled disables both halves.
 *
 * Easy to get half right: the primary is a `Button` and takes `disabled`
 * from the prop, while the menu trigger is a different element and has to
 * be told separately. A split button whose arrow still opens while its
 * action is disabled offers choices that cannot be taken.
 */
export const DisabledDisablesBoth: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", menuLabel: "" },
  render: () => (
    <SplitButton
      label="Save"
      menuLabel="More save options"
      items={OPTIONS}
      disabled
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "More save options" }),
      "the arrow still opens while the action is disabled",
    ).toBeDisabled();
  },
};

/**
 * The parts, for what the `items` shorthand cannot express.
 *
 * A keyboard hint beside an item, a separator between two groups. These
 * are `Menu`'s parts re-exported rather than re-implemented, so how a menu
 * item looks has one definition — and a caller does not have to know that a
 * split button's popup happens to be a `Menu` in order to compose one.
 */
export const WithMenuParts: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", menuLabel: "" },
  render: () => (
    <SplitButton label="Save" menuLabel="More save options">
      <SplitButton.Item>
        Save and close
        <kbd style={{ marginInlineStart: "auto", opacity: 0.6 }}>⌘⇧S</kbd>
      </SplitButton.Item>
      <SplitButton.Item>Save as draft</SplitButton.Item>
      <SplitButton.Separator />
      <SplitButton.Item danger>Discard changes</SplitButton.Item>
    </SplitButton>
  ),
};
