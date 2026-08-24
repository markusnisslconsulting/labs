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
    // Click activation; keyboard users get Arrow/Home/End plus
    // Enter from Base UI's tablist handling.
    await userEvent.click(canvas.getByRole("tab", { name: "Product row" }));
    await expect(
      canvas.getByRole("tab", { name: "Product row" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByText("The write lands here.")).toBeVisible();
  },
};
