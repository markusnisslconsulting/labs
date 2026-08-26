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
  parameters: { chromatic: { disableSnapshot: true } },
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

const REGIONS = [
  { value: "eu", label: "European Union" },
  { value: "uk", label: "United Kingdom" },
  { value: "us", label: "United States" },
];

/**
 * Every state in one frame, and the component's only snapshotted story.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <Select label="Rest" options={REGIONS} />
      <Select
        label="With hint"
        hint="Determines delivery windows."
        options={REGIONS}
      />
      <Select label="Disabled" options={REGIONS} disabled />
    </div>
  ),
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
