import { expect, userEvent } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Alert } from "./Alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs", "stable"],
  argTypes: grouped(
    "severity",
    "title",
    "children",
    "onDismiss",
    "dismissLabel",
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    severity: "info",
    title: "Scheduled maintenance",
    children: "The ordering desk is read-only on Sunday night.",
  },
};

export const DangerIsAssertive: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
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
  parameters: { chromatic: { disableSnapshot: true } },
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

export const Warning: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    severity: "warning",
    title: "Lead time missing",
    children: "Two suppliers have no lead time on file.",
  },
  play: async ({ canvas }) => {
    // warning is assertive, like danger: it interrupts.
    await expect(
      canvas.getByRole("alert", { name: /Lead time/ }),
    ).toBeVisible();
  },
};

/**
 * Every state in one frame.
 *
 * This is the story Chromatic photographs; the per-state stories above
 * opt out, so one component costs one image per theme instead of one per
 * variant. They still run as tests — disabling a snapshot does not
 * disable a play function — and they still document each state on its own
 * in the docs page. A reviewer also sees every combination side by side,
 * which is easier to judge than five separate images.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {(["info", "success", "warning", "danger"] as const).map((severity) => (
        <Alert key={severity} severity={severity} title={severity}>
          One line of supporting detail.
        </Alert>
      ))}
    </div>
  ),
};

/**
 * The dismiss control is reachable and works from the keyboard.
 *
 * Interaction only, so it does not snapshot. Alert was never asked for
 * this: the coverage gate looked for a lowercase `<button>` and Alert's
 * dismiss is a `<Button>`, so a component whose only interactive part is
 * a button counted as having none.
 */
export const DismissFromTheKeyboard: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: function Render() {
    const [gone, setGone] = useState(false);
    if (gone) return <p>Dismissed.</p>;
    return (
      <Alert severity="info" title="Heads up" onDismiss={() => setGone(true)}>
        The negotiation agent drafted three changes.
      </Alert>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const dismiss = canvas.getByRole("button", { name: "Dismiss" });
    await expect(dismiss).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByText("Dismissed.")).toBeVisible();
  },
};
