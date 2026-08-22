import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["primary", "ghost", "confirm-mini", "danger-mini"],
      table: { category: "Appearance", defaultValue: { summary: "primary" } },
    },
    disabled: {
      control: "boolean",
      table: { category: "State" },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: "Run the agent" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Reset" },
};

export const ConfirmMini: Story = {
  args: { variant: "confirm-mini", children: "Accept" },
};

export const DangerMini: Story = {
  args: { variant: "danger-mini", children: "Undo" },
};

export const Disabled: Story = {
  args: { children: "Run the agent", disabled: true },
  play: async ({ canvas }) => {
    // A disabled button stays in the DOM and keeps its accessible
    // name, so screen readers can still find the control.
    const button = canvas.getByRole("button", { name: "Run the agent" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveTextContent("Run the agent");
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.8rem", justifyItems: "start" }}>
      <Button>Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <Button variant="confirm-mini">Accept</Button>
        <Button variant="danger-mini">Undo</Button>
      </div>
    </div>
  ),
};
