import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trail: Story = {
  args: {
    items: [
      { label: "Labs", href: "/" },
      { label: "Chat box", href: "/chat-box" },
      { label: "Undo machine" },
    ],
  },
  play: async ({ canvas }) => {
    // The current page is text, never a link to itself.
    await expect(canvas.getByText("Undo machine")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: "Chat box" })).toBeVisible();
  },
};
