import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./Accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleOpen: Story = {
  args: {
    items: [
      {
        id: "what",
        title: "What is pinned here?",
        body: <p>The logic packages and their transition tests.</p>,
      },
      {
        id: "why",
        title: "Why one panel open at a time?",
        body: <p>Focus stays on one answer; multiple is a prop away.</p>,
      },
    ],
  },
  play: async ({ canvas }) => {
    const second = canvas.getByRole("button", { name: /Why one panel/ });
    await userEvent.click(second);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    // Single-open mode closes the first section.
    await expect(
      canvas.getByRole("button", { name: /What is pinned/ }),
    ).toHaveAttribute("aria-expanded", "false");
  },
};
