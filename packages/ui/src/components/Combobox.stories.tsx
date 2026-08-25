import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox } from "./Combobox";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  tags: ["autodocs"],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SupplierRegion: Story = {
  args: {
    label: "Supplier region",
    options: ["European Union", "United Kingdom", "United States", "Japan"],
    placeholder: "Type to filter",
  },
  play: async ({ canvas }) => {
    // Das Input traegt den Namen (aria-label); Filterung und Listbox
    // sind Base UIs getestete Oberflaeche.
    await expect(
      canvas.getByRole("combobox", { name: "Supplier region" }),
    ).toBeVisible();
  },
};
