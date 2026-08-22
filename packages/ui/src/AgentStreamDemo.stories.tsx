import type { Meta, StoryObj } from "@storybook/react-vite";
import AgentStreamDemo from "./AgentStreamDemo";

const meta = {
  title: "Chat Box/Agent stream",
  component: AgentStreamDemo,
  tags: ["autodocs"],
} satisfies Meta<typeof AgentStreamDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The proposal phase of one scripted agent run, shown twice. */
export const Default: Story = {};
