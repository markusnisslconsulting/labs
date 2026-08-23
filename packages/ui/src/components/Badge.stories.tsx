import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: "neutral", children: "Draft" } };
export const Accent: Story = { args: { tone: "accent", children: "New" } };
export const Success: Story = { args: { tone: "success", children: "Active" } };
export const Danger: Story = { args: { tone: "danger", children: "Failed" } };
