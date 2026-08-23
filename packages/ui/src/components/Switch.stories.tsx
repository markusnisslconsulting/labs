import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { label: "Compact rows" },
  play: async ({ canvas }) => {
    const sw = canvas.getByRole("switch", { name: "Compact rows" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    // Space toggles; role=switch announces on/off.
    await userEvent.click(canvas.getByText("Compact rows"));
    await expect(sw).toHaveAttribute("aria-checked", "true");
  },
};

export const On: Story = {
  args: { label: "Compact rows", defaultChecked: true },
};
