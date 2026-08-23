import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./Tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePanels: Story = {
  args: {
    label: "Sample details",
    defaultActive: 0,
    tabs: [
      { id: "transcript", label: "Transcript", content: <p>The log view.</p> },
      {
        id: "row",
        label: "Product row",
        content: <p>The write lands here.</p>,
      },
      { id: "events", label: "Events", content: <p>The AG-UI vocabulary.</p> },
    ],
  },
  play: async ({ canvas }) => {
    // Arrow keys move selection per the ARIA pattern.
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(
      canvas.getByRole("tab", { name: "Product row" }),
    ).toHaveAttribute("aria-selected", "true");
  },
};
