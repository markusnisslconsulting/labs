import { expect } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: grouped("shape", "width", "height"),
  parameters: {
    docs: {
      description: {
        component:
          "Placeholder while content loads. The shimmer translates a pseudo-element, so it stays on the compositor however many instances a page renders, and it stops under prefers-reduced-motion.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { shape: "line" },
};
export const Circle: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { shape: "circle" },
};
export const Block: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { shape: "block" },
};

export const CardPlaceholder: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <div style={{ display: "grid", gap: "var(--uix-gap-md)", width: "18rem" }}>
      <Skeleton shape="block" />
      <Skeleton shape="line" />
      <Skeleton shape="line" />
    </div>
  ),
};

export const HiddenFromAssistiveTechnology: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { shape: "line" },
  play: async ({ canvasElement }) => {
    // The waiting state belongs to the region that is loading, so the
    // placeholder itself must not be announced.
    const skeleton = canvasElement.querySelector(".uix-skeleton");
    await expect(skeleton).toHaveAttribute("aria-hidden", "true");
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
    <div style={{ display: "grid", gap: "1rem" }}>
      {(["line", "circle", "block"] as const).map((shape) => (
        <Skeleton key={shape} shape={shape} />
      ))}
    </div>
  ),
};
