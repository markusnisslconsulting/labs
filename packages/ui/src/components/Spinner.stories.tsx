import { expect } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  tags: ["autodocs", "stable"],
  argTypes: grouped("size", "label"),
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { size: "sm" },
};
export const Large: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { size: "lg" },
};

/** role="status" with a hidden label announces the wait. */
export const Announced: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Spinner label="Loading reorder points" />
      <Spinner size="sm" label="Saving" />
    </div>
  ),
  play: async ({ canvas }) => {
    // Two spinners, two status regions: getAllByRole is required.
    const statuses = canvas.getAllByRole("status");
    await expect(statuses).toHaveLength(2);
    await expect(
      canvas.getByText("Loading reorder points"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Saving")).toBeInTheDocument();
  },
};

/**
 * Every state in one frame.
 *
 * This is the story Chromatic photographs; the per-state stories above
 * opt out, so one component costs one image per theme instead of one per
 * variant. They still run as tests — disabling a snapshot does not
 * disable a play function — and they still document each state on its own
 * in the docs page. A reviewer also sees every combination side by side,
 * which is easier to judge than five separate images.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.6rem",
        alignItems: "center",
      }}
    >
      {(["sm", "md", "lg"] as const).map((size) => (
        <Spinner key={size} size={size} label={`Loading ${size}`} />
      ))}
    </div>
  ),
};
