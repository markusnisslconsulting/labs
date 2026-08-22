import type { Meta, StoryObj } from "@storybook/react-vite";
import AgentStreamDemo from "./AgentStreamDemo";

const meta = {
  title: "Demos/Agent stream",
  component: AgentStreamDemo,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Composition of primitives over two logic packages: `@labs/agent-stream` drives the events, `@labs/undo-machine` keeps the row honest. Source: [AgentStreamDemo.tsx](https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/AgentStreamDemo.tsx).",
      },
      source: {
        code: `<AgentStreamDemo />

// Inside: Panel > uix-actions (Button, Button) + two panes.
// Events come from createScriptedRun({ fromUnits, toUnits, callbacks }).`,
      },
    },
  },
} satisfies Meta<typeof AgentStreamDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The proposal phase of one scripted agent run, shown twice. */
export const Default: Story = {};
