import type { Meta, StoryObj } from "@storybook/react-vite";
import { NARROW } from "../../.storybook/modes";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { AlertDialog, Dialog } from "./Dialog";
import { Button } from "./Button";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs", "stable"],
  // Every story drives its own open state through render(); these satisfy
  // the required props for the args table and docs.
  args: { open: false, title: "Edit reorder point" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit reorder point</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit reorder point"
        description="The change applies to SKU 4711 from the next planning run."
        footer={
          <>
            <Button
              variant="outline"
              tone="neutral"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <p>Current value: 800 units.</p>
      </Dialog>
    </>
  );
}

/**
 * These keep their snapshots deliberately: an open dialog is the state
 * worth baselining, and it only exists after the play function opens it.
 */
export const Modal: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => <DialogDemo />,
};

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button tone="neutral" onClick={() => setOpen(true)}>
        Delete lab
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this lab?"
        description="The folder and its stories go with it. This cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              tone="neutral"
              onClick={() => setOpen(false)}
            >
              Keep it
            </Button>
            <Button onClick={() => setOpen(false)}>Delete</Button>
          </>
        }
      />
    </>
  );
}

export const Confirm: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  render: () => <ConfirmDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Delete lab/ }));
    // alertdialog, not dialog: the decision is explicit and interrupting.
    await expect(
      await within(document.body).findByRole("alertdialog", {
        name: /Delete this lab/,
      }),
    ).toBeVisible();
  },
};

/**
 * Opened from the keyboard, which is the part that matters: a dialog you
 * can only reach with a mouse is not reachable. Interaction only.
 */
export const KeyboardReachable: StoryObj = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  render: () => <DialogDemo />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const trigger = canvas.getByRole("button", { name: /Edit reorder/ });
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(
      await within(document.body).findByRole("dialog", {
        name: /Edit reorder point/,
      }),
    ).toBeVisible();
  },
};

/**
 * Open from the first frame, with something focusable behind it.
 *
 * A fixture rather than a demonstration. The Modal story opens its dialog
 * inside `play()`, so anything loading the page without running play sees
 * an ambiguous state — which is what made the focus test assert against a
 * dialog that may or may not have been open. `defaultOpen` exists now, so
 * the fixture can simply be open.
 *
 * The button behind is the point: a focus trap is only observable if there
 * is something outside to escape to.
 */
export const OpenWithPageBehind: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <>
      <Button>Behind the modal</Button>
      <Dialog
        defaultOpen
        title="Edit reorder point"
        description="The change applies to SKU 4711 from the next planning run."
        footer={<Button>Save</Button>}
      >
        <p>Focus belongs in here until this closes.</p>
      </Dialog>
    </>
  ),
};

/**
 * The behaviour of Modal, asserted. Hidden from the sidebar: the
 * frame after an assertion is the resting state again, so it would
 * show the reader a second copy of the example above.
 */
export const ModalBehaviour: Story = {
  tags: ["!dev"],
  args: Modal.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Edit reorder/ }));
    // the dialog is named by its title and described by its text, so a
    // screen reader announces both without reading the whole surface.
    // Base UI portals the popup outside #storybook-root, so query the
    // document rather than the story canvas.
    const dialog = await within(document.body).findByRole("dialog", {
      name: /Edit reorder point/,
    });
    await expect(dialog).toBeVisible();
  },
};
