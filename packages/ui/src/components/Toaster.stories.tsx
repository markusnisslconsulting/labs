import type { Meta, StoryObj } from "@storybook/react-vite";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ToastProvider, useToast } from "../toast";
import { Toaster, type ToastItem } from "./Toaster";
import { Button } from "./Button";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  tags: ["autodocs", "beta"],
  // Stories own the toast list through render(); these satisfy the
  // required props for the args table and docs.
  args: { toasts: [], onDismiss: () => {} },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const initial: ToastItem[] = [
  {
    id: "1",
    severity: "success",
    title: "Saved",
    description: "SKU 4711 updated.",
  },
  {
    id: "2",
    severity: "warning",
    title: "Stock low",
    description: "Six days of cover left.",
  },
];

function ToasterDemo({
  position,
}: {
  position?: "bottom-right" | "top-center";
}) {
  const [toasts, setToasts] = useState(initial);
  return (
    <>
      <Button onClick={() => setToasts(initial)}>Show toasts</Button>
      <Toaster
        toasts={toasts}
        position={position}
        onDismiss={(id) => setToasts((all) => all.filter((t) => t.id !== id))}
      />
    </>
  );
}

export const Stack: Story = {
  parameters: {
    chromatic: { disableSnapshot: false, modes: { ...NARROW_AND_RTL } },
  },
  render: () => <ToasterDemo />,
  play: async ({ canvas }) => {
    // Severity decides politeness: success is a status, warning alerts.
    // Assert the announced text rather than an accessible name — a live
    // region is announced from its content and takes no name from it.
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved");
    await expect(canvas.getByRole("alert")).toHaveTextContent("Stock low");
  },
};

export const Dismissing: Story = {
  render: () => <ToasterDemo />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const closers = canvas.getAllByRole("button", { name: /Dismiss/i });
    await userEvent.click(closers[0]!);
    // Dismissing removes the node rather than hiding it, so nothing
    // lingers in the accessibility tree.
    await expect(canvas.queryByRole("status")).toBeNull();
  },
};

export const TopCentre: Story = {
  render: () => <ToasterDemo position="top-center" />,
};

/** Reachable from the keyboard. Interaction only, so it does not snapshot. */
export const KeyboardReachable: Story = {
  render: () => <ToasterDemo />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    // The demo's own button comes first; the toast close buttons follow.
    await expect(
      canvas.getByRole("button", { name: /Show toasts/ }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getAllByRole("button", { name: /Dismiss/ })[0]!,
    ).toHaveFocus();
  },
};

/**
 * The imperative form, which is how a notification actually arrives.
 *
 * A notification does not come from the component tree, it comes from
 * whatever just finished — a save, a fetch, a rules run. The controlled
 * form above makes every consumer hold a list, mint ids and remove
 * entries; this is one function call.
 *
 * Note the defaults: info and success disappear on their own, warning and
 * danger stay until dismissed. An error that vanishes by itself is an
 * error nobody read.
 */
export const Imperative: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: function Render() {
    function Raise() {
      const toast = useToast();
      return (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button onClick={() => toast.success("Reorder point saved")}>
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.danger("Could not reach the supplier", {
                description: "Nordwind Logistik did not answer in 30 seconds.",
              })
            }
          >
            Fail
          </Button>
          <Button variant="ghost" onClick={() => toast.clear()}>
            Clear
          </Button>
        </div>
      );
    }
    return (
      <ToastProvider>
        <Raise />
      </ToastProvider>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Fail" }));
    const region = await within(document.body).findByRole("region", {
      name: /Notifications/,
    });
    await expect(region).toContainElement(
      await within(region).findByText("Could not reach the supplier"),
    );
    // A danger toast has role alert, so it interrupts rather than waits.
    // Queried without a name: `alert` does not take its accessible name
    // from its content, so asking for one finds nothing even when the
    // alert is right there with the text inside it.
    const alert = within(region).getByRole("alert");
    await expect(alert).toContainElement(
      within(alert).getByText("Could not reach the supplier"),
    );
  },
};
