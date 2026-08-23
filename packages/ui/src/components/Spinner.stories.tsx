import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };

/** role="status" with a hidden label announces the wait. */
export const Announced: Story = {
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
