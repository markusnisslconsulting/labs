import type { Meta, StoryObj } from "@storybook/react-vite";
import UndoMachineDemo from "./UndoMachineDemo";

const meta = {
  title: "Demos/Undo machine",
  component: UndoMachineDemo,
  tags: ["autodocs"],
} satisfies Meta<typeof UndoMachineDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Propose, accept, undo: the write lifecycle as a state machine. */
export const Default: Story = {};
