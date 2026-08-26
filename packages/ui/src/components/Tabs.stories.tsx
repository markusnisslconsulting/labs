import { expect, userEvent } from "storybook/test";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./Tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs", "stable"],
  args: {
    label: "Sample details",
    defaultActive: 0,
    tabs: [
      { id: "transcript", label: "Transcript", content: <p>The log view.</p> },
      {
        id: "row",
        label: "Product row",
        content: <p>The write lands here.</p>,
      },
      { id: "events", label: "Events", content: <p>The AG-UI vocabulary.</p> },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePanels: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
};

/**
 * Every state in one frame, and the component's only snapshotted story.
 * It keeps the narrow and RTL modes: a tablist is the component most
 * likely to overflow, and its underline sits on the inline edge.
 */
export const Matrix: Story = {
  parameters: {
    chromatic: { disableSnapshot: false, modes: { ...NARROW_AND_RTL } },
  },
  args: {
    label: "Sample details",
    tabs: [
      { id: "transcript", label: "Transcript", content: <p>The log view.</p> },
      {
        id: "row",
        label: "Product row",
        content: <p>The write lands here.</p>,
      },
      {
        id: "audit",
        label: "Audit (disabled)",
        content: <p>Unavailable for this sample.</p>,
        disabled: true,
      },
    ],
  },
};

/** Interaction only; see the note in Accordion.stories. */
export const SwitchingPanels: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Product row" }));
    await expect(
      canvas.getByRole("tab", { name: "Product row" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByText("The write lands here.")).toBeVisible();
  },
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("tab")[0]!;
    await expect(target).toHaveFocus();
  },
};
