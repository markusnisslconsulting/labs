import { expect, userEvent } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextField } from "./TextField";

const meta = {
  title: "Components/TextField",
  component: TextField,
  tags: ["autodocs", "stable"],
  argTypes: grouped("label", "hint", "error", "prefix", "suffix"),
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Order number",
    placeholder: "4711",
    hint: "Find it in your confirmation email.",
  },
  play: async ({ canvas }) => {
    // Assertions only, so the reference state stays empty: the hint is
    // linked whether or not anyone has typed.
    await expect(
      canvas.getByLabelText("Order number"),
    ).toHaveAccessibleDescription(/confirmation email/);
  },
};

/**
 * Interaction, not a reference state, so it does not snapshot: typing is
 * how the for/id link is proven, and a filled field is not the state the
 * name Default promises.
 */
export const TypingIntoTheLabelledField: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  args: { label: "Order number", hint: "Find it in your confirmation email." },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Order number");
    await userEvent.type(input, "4711");
    await expect(input).toHaveValue("4711");
  },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <TextField label="Rest" placeholder="4711" />
      <TextField label="With hint" hint="Find it in your confirmation email." />
      <TextField
        label="With error"
        error="We could not find that order number."
      />
      <TextField label="With affixes" prefix=">=" suffix="units" />
      <TextField label="Required" required placeholder="4711" />
      <TextField label="Disabled" defaultValue="4711" disabled />
    </div>
  ),
};

export const WithError: Story = {
  // `invalid: true` used to be here behind an `as never` cast, which is
  // what a prop that does not exist looks like when TypeScript is talked
  // out of the way: it reached the DOM as a non-boolean attribute. The
  // component derives data-invalid and aria-invalid from `error` itself,
  // so there was nothing to pass. React had been warning about it in the
  // console for months; the old test runner did not read the console.
  args: {
    label: "Order number",
    error: "We could not find that order number.",
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    label: "Reorder point",
    prefix: ">=",
    suffix: "units",
    defaultValue: 1240,
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
  args: Default.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("textbox")[0]!;
    await expect(target).toHaveFocus();
  },
};
