import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import { Toaster, type ToastItem } from "./Toaster";
import { Button } from "./Button";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  tags: ["autodocs"],
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
