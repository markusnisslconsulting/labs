import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";

const meta = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SupplierRegion: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  args: {
    label: "Supplier region",
    hint: "Determines delivery windows.",
    options: [
      { value: "eu", label: "European Union" },
      { value: "uk", label: "United Kingdom" },
      { value: "us", label: "United States" },
    ],
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
