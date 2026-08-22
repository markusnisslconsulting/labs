import type { Meta, StoryObj } from "@storybook/react-vite";
import WebMcpDemo from "./WebMcpDemo";

const meta = {
  title: "Demos/Ordering desk",
  component: WebMcpDemo,
  tags: ["autodocs"],
} satisfies Meta<typeof WebMcpDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A page that registers set_reorder_point as a callable tool. */
export const Default: Story = {};
