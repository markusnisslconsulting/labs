import type { Meta, StoryObj } from "@storybook/react-vite";
import OnDeviceDemo from "./OnDeviceDemo";

const meta = {
  title: "Demos/Built-in APIs",
  component: OnDeviceDemo,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Pure view over the browser: every chip is a live `availability()` answer, every button wraps one built-in call with its fallback state designed. Source: [OnDeviceDemo.tsx](https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/OnDeviceDemo.tsx).",
      },
      source: {
        code: `if (!hasApi(name)) return set("absent");
check().then((state) => !cancelled && set(state));`,
      },
    },
  },
} satisfies Meta<typeof OnDeviceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Live availability answers for all seven built-in APIs. Outside a
   Chrome with the on-device model this renders exactly the absent
 * states the article says to design for, which is the point.
 */
export const Default: Story = {};
