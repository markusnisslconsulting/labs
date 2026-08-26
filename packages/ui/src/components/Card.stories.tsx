import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  // Slots are part of the API, so they belong in the props table.
  subcomponents: { Header: Card.Header, Body: Card.Body, Footer: Card.Footer },
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj;

export const WithSlots: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Card>
      <Card.Header>Supplier · Nordwind Logistik</Card.Header>
      <Card.Body>
        <p>
          Delivery windows updated weekly. The negotiation agent drafts changes;
          a person commits them.
        </p>
      </Card.Body>
      <Card.Footer>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Badge tone="success">Active</Badge>
          <Button variant="outline" size="sm">
            Open desk
          </Button>
        </div>
      </Card.Footer>
    </Card>
  ),
};

export const SlotsForwardTheirProps: Story = {
  render: () => (
    <Card aria-label="Supplier card">
      <Card.Header id="supplier-header">Nordwind Logistik</Card.Header>
      <Card.Body>
        <p>Every slot takes the attributes of the element it renders.</p>
      </Card.Body>
    </Card>
  ),
  play: async ({ canvas }) => {
    // article + aria-label, which was unreachable while the slots took
    // only children.
    await expect(
      canvas.getByRole("article", { name: "Supplier card" }),
    ).toBeVisible();
  },
};
