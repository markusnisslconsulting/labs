import { expect } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusPill } from "./StatusPill";

const meta = {
  title: "Components/StatusPill",
  component: StatusPill,
  tags: ["autodocs", "stable"],
  argTypes: grouped("tone", "children"),
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "ok", children: "ready on this machine" },
};
export const Warn: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "warn", children: "needs a download" },
};
export const Off: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "off", children: "not exposed by this browser" },
};

/**
 * The dot is decorative and hidden from assistive technology; the
 * words carry the state. Side by side, so the three tones can be
 * compared and their contrast checked at once.
 */
export const AllTones: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "0.5rem", justifyItems: "start" }}>
      <StatusPill tone="ok">ready on this machine</StatusPill>
      <StatusPill tone="warn">needs a download</StatusPill>
      <StatusPill tone="off">not exposed by this browser</StatusPill>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("ready on this machine")).toBeVisible();
    await expect(canvas.getByText("needs a download")).toBeVisible();
    await expect(canvas.getByText("not exposed by this browser")).toBeVisible();
  },
};
