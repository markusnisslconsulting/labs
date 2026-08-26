import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberField } from "./NumberField";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  tags: ["autodocs", "beta"],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReorderPoint: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Reorder point",
    min: 0,
    max: 10_000,
    step: 10,
    defaultValue: 800,
  },
};

/** Interaction only: the value moves, so it does not snapshot. */
export const Stepping: Story = {
  args: ReorderPoint.args,
  parameters: { chromatic: { disableSnapshot: true } },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <NumberField label="Rest" defaultValue={800} step={10} />
      <NumberField label="At the minimum" min={0} defaultValue={0} />
      <NumberField label="Required" required defaultValue={800} />
      <NumberField label="Disabled" defaultValue={800} disabled />
    </div>
  ),
};

/** Reachable from the keyboard. Interaction only, so it does not snapshot. */
export const KeyboardReachable: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  args: ReorderPoint.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    // Base UI renders a text input with inputmode numeric rather than a
    // spinbutton, so the role to expect is textbox.
    await expect(canvas.getByRole("textbox")).toHaveFocus();
  },
};

/** Stepping, asserted. Hidden: it renders the example above again. */
export const SteppingBehaviour: Story = {
  tags: ["!dev"],
  args: Stepping.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: /Increase/ }).click();
    await expect(
      canvas.getByRole("textbox", { name: "Reorder point" }),
    ).toHaveValue("810");
  },
};

/** ReorderPoint, asserted. Hidden: it renders the example above again. */
export const ReorderPointBehaviour: Story = {
  tags: ["!dev"],
  args: ReorderPoint.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    // Assertion only. This story used to click Increase while still
    // being snapshotted, so the baseline held 810 under a name that
    // promised 800 — the same trap Switch's Off story fell into.
    await expect(
      canvas.getByRole("textbox", { name: "Reorder point" }),
    ).toHaveValue("800");
  },
};

/**
 * Required, with a hint and an error. NumberField's label was typed
 * `string` because its accessible name came from `aria-label`; a real
 * `<label>` lifted that, so a label can now carry a unit or a tooltip.
 */
export const RequiredWithError: Story = {
  /* The matrix above already photographs `required`; this story is the
     documented example, not a second baseline. The snapshot budget gate
     is what asked the question. */
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Reorder point",
    defaultValue: 800,
    required: true,
    hint: "Units, not cases.",
    error: "Below the minimum order quantity for this supplier.",
  },
};
