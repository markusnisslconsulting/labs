import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Without an image: initials, named via role="img". */
export const Initials: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { name: "Ada Lovelace" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Ada Lovelace" }),
    ).toBeVisible();
  },
};

export const WithImage: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    name: "Ada Lovelace",
    src: "https://i.pravatar.cc/80?img=5",
  },
};

export const Sizes: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
    </div>
  ),
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
      {(["sm", "md", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} name="Nora Weiss" />
      ))}
      {(["sm", "md", "lg"] as const).map((size) => (
        <Avatar
          key={`img-${size}`}
          size={size}
          name="Nora Weiss"
          src="./logo.webp"
        />
      ))}
    </div>
  ),
};
