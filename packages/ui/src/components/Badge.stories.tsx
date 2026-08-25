import { expect } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: grouped("tone", "children"),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "neutral", children: "Draft" },
};
export const Accent: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "accent", children: "New" },
};
export const Success: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "success", children: "Active" },
};
export const Danger: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "danger", children: "Failed" },
};

export const ToneIsNeverTheOnlySignal: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "danger", children: "Failed" },
  play: async ({ canvas }) => {
    // Colour distinguishes tones for sighted users; the word is what
    // reaches everyone else and greyscale print.
    await expect(canvas.getByText("Failed")).toBeVisible();
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
  render: () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.6rem",
        alignItems: "center",
      }}
    >
      {(["neutral", "accent", "success", "danger"] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};
