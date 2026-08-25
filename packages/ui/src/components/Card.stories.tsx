import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj;

export const WithSlots: Story = {
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
