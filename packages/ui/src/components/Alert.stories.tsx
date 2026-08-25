import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Alert } from "./Alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    severity: "info",
    title: "Scheduled maintenance",
    children: "The ordering desk is read-only on Sunday night.",
  },
};

export const DangerIsAssertive: Story = {
  args: {
    severity: "danger",
    title: "Payment failed",
    children: "The last attempt was declined by the bank.",
  },
  play: async ({ canvas }) => {
    // danger speaks assertively; info and success stay polite.
    await expect(
      canvas.getByRole("alert", { name: /Payment failed/ }),
    ).toBeVisible();
  },
};

function DismissibleAlert() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Alert severity="success" title="Saved" onDismiss={() => setOpen(false)}>
      Your reorder points were updated.
    </Alert>
  ) : (
    <p>Dismissed.</p>
  );
}

export const Dismissible: StoryObj = {
  render: () => <DismissibleAlert />,
};

/**
 * Interaction, not a reference state. Dismissing leaves the alert gone,
 * so snapshotting this recorded an empty page under the name of the
 * component: the story that looked broken was doing exactly what it said.
 */
export const DismissingRemovesIt: StoryObj = {
  render: () => <DismissibleAlert />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: "Dismiss" }).click();
    await expect(canvas.getByText("Dismissed.")).toBeVisible();
  },
};
