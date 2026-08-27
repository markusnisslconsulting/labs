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
  subcomponents: {
    Media: Card.Media,
    Header: Card.Header,
    Body: Card.Body,
    Footer: Card.Footer,
  },
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj;

export const WithSlots: Story = {
  /* Not the snapshotted frame any more: `Matrix` below is, the same as every
     other component here. Card had `WithSlots` as its one frame from before
     that convention settled, and adding a second frame for the media slot
     would have made Card the only component with two. */
  parameters: { chromatic: { disableSnapshot: true } },
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
};

/** SlotsForwardTheirProps, asserted. Hidden: it renders the example above again. */
export const SlotsForwardTheirPropsBehaviour: Story = {
  tags: ["!dev"],
  args: SlotsForwardTheirProps.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    // article + aria-label, which was unreachable while the slots took
    // only children.
    await expect(
      canvas.getByRole("article", { name: "Supplier card" }),
    ).toBeVisible();
  },
  render: () => (
    <Card aria-label="Supplier card">
      <Card.Header id="supplier-header">Nordwind Logistik</Card.Header>
      <Card.Body>
        <p>Every slot takes the attributes of the element it renders.</p>
      </Card.Body>
    </Card>
  ),
};

/* Inline rather than files: a story that fetches a photograph from a stock
   service is a visual baseline that changes when someone else's CDN does.
   The two sources are deliberately different shapes — 4:3 and 3:4 — because
   the slot's whole claim is that both come out the same height. */
const LANDSCAPE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
       <rect width="400" height="300" fill="#1f3a5f"/>
       <circle cx="320" cy="70" r="42" fill="#f2c26b"/>
       <path d="M0 230 L120 140 L210 205 L300 130 L400 220 L400 300 L0 300Z" fill="#2f5f7a"/>
     </svg>`,
  );

const PORTRAIT =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
       <rect width="300" height="400" fill="#3f2a4f"/>
       <circle cx="150" cy="150" r="70" fill="#d98a6a"/>
       <rect x="60" y="240" width="180" height="160" rx="20" fill="#6b4a7a"/>
     </svg>`,
  );

/**
 * A banner image above the header.
 *
 * Both cards are given a picture of a different shape and both headers start
 * at the same height, which is the reason the slot fixes a ratio instead of
 * letting the image size itself. The cost is visible in the second card: the
 * portrait loses its top and bottom.
 */
export const WithMedia: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
      }}
    >
      <Card>
        <Card.Media>
          <img src={LANDSCAPE} alt="" />
        </Card.Media>
        <Card.Header>Warehouse 3 · Hamburg</Card.Header>
        <Card.Body>
          <p>Landscape source, 4:3.</p>
        </Card.Body>
      </Card>
      <Card>
        <Card.Media>
          <img src={PORTRAIT} alt="" />
        </Card.Media>
        <Card.Header>Warehouse 7 · Rotterdam</Card.Header>
        <Card.Body>
          <p>Portrait source, 3:4, cropped to the same box.</p>
        </Card.Body>
      </Card>
    </div>
  ),
};

/** Both headers sit at the same height, whatever shape the source was. */
export const WithMediaBehaviour: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const headers = [
      canvas.getByText("Warehouse 3 · Hamburg"),
      canvas.getByText("Warehouse 7 · Rotterdam"),
    ].map((node) => node.getBoundingClientRect().top);
    expect(Math.abs(headers[0]! - headers[1]!)).toBeLessThan(1);
  },
  render: WithMedia.render,
};

/**
 * A square ratio, for a grid of product shots.
 *
 * `ratio` is the escape hatch from the 16:9 default, not a reason to set it
 * per card: two cards side by side with different ratios put their titles
 * back out of line.
 */
export const MediaRatio: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Card style={{ maxWidth: "16rem" }}>
      <Card.Media ratio="1 / 1">
        <img src={PORTRAIT} alt="" />
      </Card.Media>
      <Card.Header>Pallet strap, 5 m</Card.Header>
    </Card>
  ),
};

/**
 * Every shape of card in one frame: slots alone, a banner above them, and a
 * square ratio.
 *
 * The one snapshotted story, because a visual regression in the media slot
 * is the kind nothing here asserts — `object-fit` dropping, the top corners
 * losing their clip, the box collapsing when a source is portrait. The
 * behaviour test next to it only compares two headers' offsets, which stays
 * true while the picture is wrong.
 */
export const Matrix: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
        alignItems: "start",
      }}
    >
      <Card>
        <Card.Header>Supplier · Nordwind</Card.Header>
        <Card.Body>
          <p>Header, body and footer.</p>
        </Card.Body>
        <Card.Footer>
          <Badge tone="success">Active</Badge>
        </Card.Footer>
      </Card>
      <Card>
        <Card.Media>
          <img src={LANDSCAPE} alt="" />
        </Card.Media>
        <Card.Header>Warehouse 3 · Hamburg</Card.Header>
        <Card.Body>
          <p>Landscape source, 16:9 box.</p>
        </Card.Body>
      </Card>
      <Card>
        <Card.Media>
          <img src={PORTRAIT} alt="" />
        </Card.Media>
        <Card.Header>Warehouse 7 · Rotterdam</Card.Header>
        <Card.Body>
          <p>Portrait source, cropped to the same box.</p>
        </Card.Body>
      </Card>
      <Card>
        <Card.Media ratio="1 / 1">
          <img src={PORTRAIT} alt="" />
        </Card.Media>
        <Card.Header>Pallet strap, 5 m</Card.Header>
      </Card>
    </div>
  ),
};
