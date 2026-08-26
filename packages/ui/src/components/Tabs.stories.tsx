import { expect, userEvent } from "storybook/test";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
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

/**
 * The compound API, and the reason it exists.
 *
 * A tab holding a count was not expressible before: `tabs` took
 * `label: string`, so the only way to put a badge in a tab was to stop
 * using Tabs. The array form is still there for the common case — it is
 * now a shorthand over these parts rather than the only door.
 */
export const Composed: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Tabs defaultValue="open">
      <Tabs.List aria-label="Orders">
        <Tabs.Tab value="open">
          Open <Badge tone="accent">12</Badge>
        </Tabs.Tab>
        <Tabs.Tab value="done">
          Done <Badge tone="success">318</Badge>
        </Tabs.Tab>
        <Tabs.Tab value="audit" disabled>
          Audit
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="open">
        <p>Twelve orders waiting on a person.</p>
      </Tabs.Panel>
      <Tabs.Panel value="done">
        <p>Everything the agent closed without help.</p>
      </Tabs.Panel>
      <Tabs.Panel value="audit">
        <p>Unavailable for this sample.</p>
      </Tabs.Panel>
    </Tabs>
  ),
  play: async ({ canvas }) => {
    // The badge is inside the tab's accessible name, which is the point:
    // the count is part of what the tab says.
    await expect(
      canvas.getByRole("tab", { name: /Open\s*12/ }),
    ).toHaveAttribute("aria-selected", "true");
    // aria-disabled, not the native attribute: a disabled tab stays
    // focusable per the ARIA pattern, so Base UI marks it rather than
    // removing it from the tab order. That is also why Tabs.css has to
    // match [data-disabled] — :disabled never fires here.
    await expect(canvas.getByRole("tab", { name: "Audit" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
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
