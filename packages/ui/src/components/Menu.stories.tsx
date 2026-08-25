import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

const meta = {
  title: "Components/Menu",
  component: Menu,
  tags: ["autodocs"],
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
  args: {
    label: "Row actions",
    items: [
      { id: "duplicate", label: "Duplicate" },
      { id: "archive", label: "Archive" },
      { id: "delete", label: "Delete", danger: true },
    ],
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Row actions/ });
    await expect(trigger).toHaveClass("uix-button");
    await expect(trigger).toBeVisible();
  },
};
