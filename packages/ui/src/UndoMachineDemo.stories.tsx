import type { Meta, StoryObj } from "@storybook/react-vite";
import UndoMachineDemo from "./UndoMachineDemo";

const meta = {
  title: "Demos/Undo machine",
  component: UndoMachineDemo,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A `useReducer` over `@labs/undo-machine`'s `reduceRow`. Every button dispatches a typed event; the backend answer arrives as a separate commit event. Source: [UndoMachineDemo.tsx](https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/UndoMachineDemo.tsx).",
      },
      source: {
        code: `const [state, dispatch] = useReducer(demoReducer, initialDemoState);

// propose -> person-accepted -> commit-succeeded
// undo is a NEW write: person-undid walks committing again.`,
      },
    },
  },
} satisfies Meta<typeof UndoMachineDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Propose, accept, undo: the write lifecycle as a state machine. */
export const Default: Story = {};
