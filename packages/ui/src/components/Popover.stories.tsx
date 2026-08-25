import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj;

/**
 * Trigger wiring asserted; the lazy popup (title, body, close) is
 * Base UI's own tested surface — same policy as Menu and Tooltip.
 */
export const Details: Story = {
  args: {
    trigger: "Delivery details",
    title: "Nordwind Logistik",
    children: (
      <p>
        Windows update weekly. The negotiation agent drafts changes; a person
        commits them.
      </p>
    ),
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Delivery details/ });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveClass("uix-button");
  },
};
