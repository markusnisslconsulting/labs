import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { Switch } from "./Switch";
import { TextField } from "./TextField";

const meta = {
  title: "Foundations/Brands",
  parameters: {
    layout: "padded",
    // Brand is the subject on this page, so it is the one place worth
    // paying for the extra dimension. Everywhere else the global modes
    // in preview.tsx cover light and dark only.
    chromatic: {
      modes: {
        light: { theme: "light", brand: "default" },
        dark: { theme: "dark", brand: "default" },
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** What each brand file re-points, so the column has something to claim. */
const BRANDS = [
  {
    brand: undefined,
    name: "Labs",
    changes: "the baseline every other brand is a diff against",
  },
  {
    brand: "ocean",
    name: "Ocean",
    changes: "one token: --uix-accent. Focus ring and washes follow it.",
  },
  {
    brand: "graphite",
    name: "Graphite",
    changes:
      "shape, display face, elevation and accent. Corners near-square, headings serif, shadows replaced by hairlines.",
  },
] as const;

function Sample() {
  return (
    <div style={{ display: "grid", gap: "0.8rem", justifyItems: "stretch" }}>
      <Button>Primary action</Button>
      <TextField label="Order number" placeholder="4711" />
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <Chip>Pill</Chip>
        <Chip>Shape</Chip>
      </div>
      <Card>
        <Card.Header>A container</Card.Header>
        <Card.Body>
          {/* A heading, because the display face is one of the things a
              brand re-points and nothing else here would show it. */}
          <h3 style={{ marginTop: 0 }}>Display face</h3>
          <p>Radius, elevation and this typeface come from the brand.</p>
        </Card.Body>
      </Card>
      <Alert severity="info" title="Info">
        Same components throughout.
      </Alert>
      <Switch label="Compact rows" defaultChecked />
    </div>
  );
}

/**
 * The three brands at once, which is the thing the toolbar cannot do.
 *
 * Every column is pinned to a brand rather than following the toolbar
 * selection. An earlier version left the first column on whatever the
 * toolbar said, which made two thirds of the page a duplicate of a
 * control that was already on screen.
 *
 * Graphite is the column that earns the page. `ocean` only re-points a
 * hue, so for a long time this comparison could not show that the brand
 * axis reaches shape, type and elevation as well — not because a brand
 * may not, but because components were naming the radius and font
 * primitives directly, below the layer a brand can see.
 */
export const SideBySide: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      {BRANDS.map(({ brand, name, changes }) => (
        <section
          key={name}
          data-brand={brand}
          style={{ display: "grid", gap: "0.8rem" }}
        >
          <div>
            <strong>{name}</strong>
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.85rem",
                color: "var(--uix-text-secondary)",
              }}
            >
              {changes}
            </p>
          </div>
          <Sample />
        </section>
      ))}
    </div>
  ),
};
