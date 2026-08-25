import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { AlertDialog, Dialog } from "./Dialog";
import { Button } from "./Button";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
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
  render: () => <DialogDemo />,
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
