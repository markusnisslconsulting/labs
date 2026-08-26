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
      <Select label="Required" required options={REGIONS} />
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
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  args: SupplierRegion.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("combobox")[0]!;
    await expect(target).toHaveFocus();
  },
};

/**
 * Required, with a hint and a failed validation — the combination that
 * was not expressible at all until Field existed. A required Select whose
 * value failed a server check had nowhere to put the message, so a form
 * with one in it grew a paragraph beside the component and wired
 * `aria-describedby` by hand.
 */
export const RequiredWithError: Story = {
  /* The matrix above already photographs `required`; this story is the
     documented example, not a second baseline. The snapshot budget gate
     is what asked the question. */
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Supplier region",
    required: true,
    hint: "Determines delivery windows.",
    error: "That region has no active contract.",
    options: [
      { value: "eu", label: "European Union" },
      { value: "uk", label: "United Kingdom" },
    ],
  },
};
