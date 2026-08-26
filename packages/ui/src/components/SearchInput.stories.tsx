import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchInput } from "./SearchInput";

const meta = {
  title: "Components/SearchInput",
  component: SearchInput,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { placeholder: "Search the labs", label: "Search the labs" },
};

/**
 * Every state in one frame. This is the component's snapshotted story:
 * one image per theme covers rest, filled and disabled, where three
 * separate stories would have cost three.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      <SearchInput label="Rest" placeholder="Search the labs" />
      <SearchInput label="Filled" defaultValue="reorder point" />
      <SearchInput label="Required" required hideLabel={false} />
      <SearchInput label="Disabled" placeholder="Unavailable" disabled />
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
  args: Default.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("searchbox")[0]!;
    await expect(target).toHaveFocus();
  },
};

/** Default, asserted. Hidden: it renders the example above again. */
export const DefaultBehaviour: Story = {
  tags: ["!dev"],
  args: Default.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    // The accessible name comes from the label, never the placeholder.
    await expect(
      canvas.getByRole("searchbox", { name: "Search the labs" }),
    ).toBeVisible();
  },
};

/** With a visible label and a hint, which a filter bar often wants. */
export const LabelledWithHint: Story = {
  /* The matrix above already photographs `required`; this story is the
     documented example, not a second baseline. The snapshot budget gate
     is what asked the question. */
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Search suppliers",
    hideLabel: false,
    placeholder: "Name or contract number",
    hint: "Matches name, contract number and city.",
  },
};
