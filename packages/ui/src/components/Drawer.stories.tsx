import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button";
import { Drawer } from "./Drawer";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every side, open, with the page behind it.
 *
 * The sides are logical: `inline-end` is the right in English and the left
 * in Arabic, because a details panel belongs on the side the reading ends
 * on and that is not a fixed edge of the screen.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <p>
        The page behind. Under a modal drawer this is inert: not tabbable, not
        clickable, and absent from the accessibility tree.
      </p>
      <Button>A control behind the drawers</Button>

      {/* All three sides in one frame, which works because they do not
          overlap: inline-start is the left edge in this direction,
          inline-end the right, and block-end a strip along the bottom.
          One is modal so the scrim is photographed too, and the other two
          are not — a scrim over an operable page is a state worth being
          able to see the absence of. */}
      <Drawer
        defaultOpen
        side="inline-end"
        title="Supplier detail"
        description="Modal: the page behind is inert."
        footer={
          <>
            <Button variant="ghost">Cancel</Button>
            <Button>Save</Button>
          </>
        }
      >
        <p>
          A panel of detail beside the thing it belongs to. Reach for Dialog
          when the task has to be finished or abandoned first.
        </p>
      </Drawer>

      <Drawer
        defaultOpen
        modal={false}
        side="inline-start"
        size="18rem"
        title="Filters"
        description="Not modal: no scrim, and the list stays usable."
      >
        <p>Region, supplier size, contract status.</p>
      </Drawer>

      <Drawer
        defaultOpen
        modal={false}
        side="block-end"
        size="9rem"
        title="Bulk actions"
        description="The sheet, which is what a narrow viewport usually wants."
      />
    </div>
  ),
};

/**
 * Not modal, and therefore no scrim.
 *
 * The case a drawer has and a dialog does not. A filter panel beside a list
 * is meant to be used *with* the list, so making the list inert defeats the
 * panel's whole purpose.
 *
 * The missing scrim is the part worth looking at. A scrim over a page that
 * is still operable tells the reader the opposite of the truth, and it
 * swallows the clicks it looks like it is inviting.
 */
export const NonModalFilterPanel: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Button>Still usable while the panel is open</Button>
      <Drawer
        defaultOpen
        modal={false}
        side="inline-start"
        title="Filters"
        description="The list stays usable while you narrow it."
      >
        <p>Region, supplier size, contract status.</p>
      </Drawer>
    </div>
  ),
};

/**
 * Modal means inert, and non-modal means operable. Measured both ways.
 *
 * The claim `modal` makes, in the only form that can fail. Base UI's own
 * `modal` prop did nothing in `1.0.0-rc.0` — measured on `Dialog`, the popup
 * had `role="dialog"` and no more — so both halves are wired in this
 * library, and a test that only checked the attribute would pass against a
 * page that is still fully operable behind the scrim.
 */
export const ModalMakesThePageInert: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: function Render() {
    const [modal, setModal] = useState(true);
    return (
      <div>
        <p>The page behind.</p>
        <Drawer
          defaultOpen
          modal={modal}
          title="Supplier detail"
          /* The toggle is inside the panel, and that is not a convenience:
             a modal drawer makes everything else on the page inert, so a
             control behind it cannot be clicked — which is the property
             this story exists to assert. A button outside the drawer was
             the first attempt and the test failed to find it, correctly. */
          footer={
            <Button onClick={() => setModal((value) => !value)}>
              Toggle modal
            </Button>
          }
        >
          <p data-testid="mode">{modal ? "modal" : "non-modal"}</p>
        </Drawer>
      </div>
    );
  },
  play: async () => {
    const body = within(document.body);

    /* The drawer portals out of the story root, so it is queried from the
       document. The page behind it is what stays in the canvas, which is
       what makes this pair of queries the right way round. */
    const drawer = body.getByRole("dialog");
    await expect(drawer).toHaveAttribute("aria-modal", "true");

    const inertBehind = () =>
      Array.from(document.body.children).some(
        (child) => !child.contains(drawer) && child.hasAttribute("inert"),
      );

    await expect(
      inertBehind(),
      "aria-modal is set and nothing behind is inert, which is the exact " +
        "state Base UI shipped: it looks modal and the page is operable",
    ).toBe(true);

    await userEvent.click(body.getByRole("button", { name: "Toggle modal" }));
    await expect(body.getByTestId("mode")).toHaveTextContent("non-modal");

    await expect(
      body.getByRole("dialog"),
      "a non-modal drawer must not claim aria-modal",
    ).not.toHaveAttribute("aria-modal");
    await expect(
      inertBehind(),
      "the page behind a non-modal drawer has to stay operable; that is " +
        "the whole reason the prop exists",
    ).toBe(false);
  },
};

/**
 * Escape closes it, and focus goes back where it came from.
 *
 * Base UI's, and asserted anyway. A panel that closes and leaves the
 * keyboard nowhere is a panel that costs a person their place on the page,
 * and it is the kind of behaviour that disappears quietly under an upgrade.
 */
export const EscapeReturnsFocus: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open the panel</Button>
        <Drawer open={open} onOpenChange={setOpen} title="Supplier detail">
          <p>Detail.</p>
        </Drawer>
      </>
    );
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Open the panel" });
    await userEvent.click(trigger);

    const body = within(document.body);
    /* Presence rather than visibility. The panel slides in over 200ms and
       starts at `opacity: 0`, which jest-dom counts as invisible — and
       `toBeVisible` does not retry, so the assertion raced the animation.
       `findByRole` waits for the element, and where focus lands is the
       claim anyway. */
    await expect(await body.findByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    /* Both assertions retry, because closing is not instant: the panel
       slides out over 200ms and stays in the DOM carrying `data-closed`
       and `data-ending-style` for the whole of it. A plain assertion
       raced that — and passed in the light run and failed in the dark
       one, which is the shape a timing bug takes when nothing about the
       theme is actually involved. */
    await waitFor(() =>
      expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        trigger,
        "the panel closed and left the keyboard nowhere",
      ).toHaveFocus(),
    );
  },
};
