import { expect, userEvent } from "storybook/test";
import { RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./Slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs", "beta"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;
export const ReorderBuffer: StoryObj<typeof meta> = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Safety buffer",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 20,
  },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 * It carries the RTL mode, because the fill direction of a range input
 * is exactly what flips with the writing direction.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <Slider label="Rest" defaultValue={20} />
      <Slider label="At the maximum" defaultValue={100} />
      <Slider label="Without the value" defaultValue={40} showValue={false} />
      <Slider label="Required" required defaultValue={20} />
      <Slider label="Disabled" defaultValue={20} disabled />
    </div>
  ),
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: StoryObj = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  args: ReorderBuffer.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("slider")[0]!;
    await expect(target).toHaveFocus();
  },
};

/** ReorderBuffer, asserted. Hidden: it renders the example above again. */
export const ReorderBufferBehaviour: StoryObj<typeof meta> = {
  tags: ["!dev"],
  args: ReorderBuffer.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const slider = canvas.getByRole("slider", { name: "Safety buffer" });
    await expect(slider).toHaveValue("20");
  },
};

/**
 * With a hint and an error, which Slider could not have: it had built its
 * own head row to show the live value, so it had diverged from every
 * other field's layout before anyone asked it for a message.
 */
export const RequiredWithError: Story = {
  /* The matrix above already photographs `required`; this story is the
     documented example, not a second baseline. The snapshot budget gate
     is what asked the question. */
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Reorder buffer",
    defaultValue: 12,
    required: true,
    hint: "Days of cover held above the reorder point.",
    error: "Must be at least 14 days for overseas suppliers.",
  },
};
