import type { Meta, StoryObj } from "@storybook/react-vite";
import OnDeviceDemo from "./OnDeviceDemo";

const meta = {
  title: "On-device AI/Built-in APIs",
  component: OnDeviceDemo,
  tags: ["autodocs"],
} satisfies Meta<typeof OnDeviceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Live availability answers for all seven built-in APIs. Outside a
   Chrome with the on-device model this renders exactly the absent
 * states the article says to design for, which is the point.
 */
export const Default: Story = {};
