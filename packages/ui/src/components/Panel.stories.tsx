import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
import { Panel } from "./Panel";

const meta = {
  title: "Components/Panel",
  component: Panel,
  // Slots are part of the API, so they belong in the props table.
  subcomponents: { Header: Panel.Header, Body: Panel.Body },
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A named landmark: screen reader users can jump to it by label. */
export const Default: Story = {
  args: {
    label: "Live · transcript versus control surface",
    children: <p>Demo content sits inside the bordered surface.</p>,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("region", {
        name: "Live · transcript versus control surface",
      }),
    ).toBeVisible();
  },
};

/** Anatomy slots for richer headers, composed on the same surface. */
export const WithSlots: StoryObj = {
  render: () => (
    <Panel label="Supplier · Nordwind Logistik">
      <Panel.Header>
        <strong>Delivery windows</strong>
        <Badge tone="success">Active</Badge>
      </Panel.Header>
      <Panel.Body>
        <p>The negotiation agent drafts changes; a person commits them.</p>
      </Panel.Body>
    </Panel>
  ),
};
