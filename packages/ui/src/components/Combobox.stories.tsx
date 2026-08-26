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
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Supplier region",
    options: ["European Union", "United Kingdom", "United States", "Japan"],
    placeholder: "Type to filter",
  },
  play: async ({ canvas }) => {
    // The input carries the accessible name. Filtering and the option
    // list are the platform's, via input[list] and datalist — this
    // component is not on Base UI, whatever an earlier comment claimed.
    await expect(
      canvas.getByRole("combobox", { name: "Supplier region" }),
    ).toBeVisible();
  },
};

const REGIONS = ["European Union", "United Kingdom", "United States", "Japan"];

/**
 * Every state in one frame, and the component's only snapshotted story.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <Combobox label="Rest" options={REGIONS} placeholder="Type to filter" />
      <Combobox label="Filled" options={REGIONS} value="Japan" />
      <Combobox label="Disabled" options={REGIONS} value="Japan" disabled />
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
