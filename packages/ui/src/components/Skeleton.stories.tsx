import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
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

export const Line: Story = { args: { shape: "line" } };
export const Circle: Story = { args: { shape: "circle" } };
export const Block: Story = { args: { shape: "block" } };

export const CardPlaceholder: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--uix-gap-md)", width: "18rem" }}>
      <Skeleton shape="block" />
      <Skeleton shape="line" />
      <Skeleton shape="line" />
    </div>
  ),
};

export const HiddenFromAssistiveTechnology: Story = {
  args: { shape: "line" },
  play: async ({ canvasElement }) => {
    // The waiting state belongs to the region that is loading, so the
    // placeholder itself must not be announced.
    const skeleton = canvasElement.querySelector(".uix-skeleton");
    await expect(skeleton).toHaveAttribute("aria-hidden", "true");
  },
};
