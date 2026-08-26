import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox } from "./Combobox";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  tags: ["autodocs", "beta"],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SupplierRegion: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
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

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  args: SupplierRegion.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("combobox")[0]!;
    await expect(target).toHaveFocus();
  },
};
