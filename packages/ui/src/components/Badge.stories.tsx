import { expect } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs", "stable"],
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
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
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
/**
 * As a link, without copying the class names.
 *
 * `renderAs` is now the one convention across Button, IconButton, Badge,
 * Chip, StatusPill and Panel. It used to exist on Button alone, which
 * meant the answer to "make this badge a link" was to reimplement the
 * badge — and a copied class name is how a design system starts losing.
 */
export const AsLink: StoryObj = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Badge
      tone="accent"
      // The anchor's content comes from Badge's children, which jsx-a11y
      // cannot see at this call site.
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      renderAs={<a href="#open-orders" />}
    >
      12 open
    </Badge>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "12 open" });
    // The element is the caller's; the styling is ours. Both survive.
    await expect(link).toHaveClass("uix-badge");
    await expect(link).toHaveAttribute("href", "#open-orders");
  },
};

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
      {(["neutral", "accent", "success", "danger"] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};
