import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs", "stable"],
  args: {
    name: "shipping",
    legend: "Shipping speed",
    defaultValue: "standard",
    options: [
      { value: "standard", label: "Standard (3-5 days)" },
      { value: "express", label: "Express (1-2 days)" },
      { value: "overnight", label: "Overnight" },
    ],
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "standard", label: "Standard (3-5 days)" },
  { value: "express", label: "Express (1-2 days)" },
  { value: "overnight", label: "Overnight" },
];

/**
 * The photographed story, so it has to carry every state the component
 * has. A `Disabled` story existed below but was not snapshotted, which
 * means the state was in Storybook for a reader and in no baseline at
 * all.
 */
export const ShippingSpeed: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <RadioGroup
        name="shipping"
        legend="Shipping speed"
        defaultValue="standard"
        options={OPTIONS}
      />
      <RadioGroup
        name="shipping-required"
        legend="Shipping speed"
        options={OPTIONS}
        required
        hint="Overnight is unavailable for pallet freight."
      />
      <RadioGroup
        name="shipping-invalid"
        legend="Shipping speed"
        options={OPTIONS}
        required
        error="Choose a shipping speed."
      />
      <RadioGroup
        name="shipping-unavailable"
        legend="Shipping speed (unavailable)"
        defaultValue="standard"
        options={OPTIONS}
        disabled
      />
    </div>
  ),
};

/** Interaction only; see the note in Accordion.stories. */
export const SelectingAnOption: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText("Express (1-2 days)"));
    await expect(canvas.getByLabelText("Express (1-2 days)")).toBeChecked();
    await expect(
      canvas.getByLabelText("Standard (3-5 days)"),
    ).not.toBeChecked();
  },
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
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("radio")[0]!;
    await expect(target).toHaveFocus();
  },
};

/** Kept for the assertion; the picture lives in the photographed story. */
export const Disabled: Story = {
  args: { disabled: true },
  parameters: { chromatic: { disableSnapshot: true } },
};

/** Disabled, asserted. Hidden: it renders the example above again. */
export const DisabledBehaviour: Story = {
  tags: ["!dev"],
  args: Disabled.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toBeDisabled();
    }
  },
};

/**
 * Required, with a hint and an error on the group rather than on any one
 * option: the requirement belongs to the choice.
 */
export const RequiredWithError: Story = {
  /* The matrix above already photographs `required`; this story is the
     documented example, not a second baseline. The snapshot budget gate
     is what asked the question. */
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    ...meta.args,
    required: true,
    hint: "Overnight is unavailable for pallet freight.",
    error: "Choose a shipping speed.",
  },
};
