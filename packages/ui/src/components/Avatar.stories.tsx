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
  args: { name: "Ada Lovelace" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Ada Lovelace" }),
    ).toBeVisible();
  },
};

export const WithImage: Story = {
  args: {
    name: "Ada Lovelace",
    src: "https://i.pravatar.cc/80?img=5",
  },
};

export const Sizes: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
    </div>
  ),
};
