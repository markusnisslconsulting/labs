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

/**
 * Two businesses, not two colour schemes.
 *
 * Both are real. The default is the consulting practice; `coaching` is
 * the personal leadership-coaching practice. They share the components
 * and the logo and nothing else, which is the case multi-brand actually
 * has to serve — not a hue swap.
 */
const BRANDS = [
  {
    brand: undefined,
    name: "Consulting",
    voice: "Warm, high-chroma, close-set. Made for someone buying delivery.",
    changes: "the baseline every other brand is a diff against",
  },
  {
    brand: "coaching",
    name: "Coaching",
    voice:
      "Cooler, quieter, more room. Made for someone deciding whether to trust you with their own development.",
    changes:
      "accent, four shape roles, the display face, three elevations and the density multiplier — one file, no core stylesheet touched",
  },
] as const;

function Sample() {
  return (
    <div style={{ display: "grid", gap: "0.9rem", justifyItems: "stretch" }}>
      <Button>Book a conversation</Button>
      <TextField label="Your name" placeholder="Jane Doe" />
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <Chip>Leadership</Chip>
        <Chip>Delivery</Chip>
      </div>
      <Card>
        <Card.Header>What you get</Card.Header>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>Display face</h3>
          <p>
            Corner radius, elevation, spacing and this typeface all come from
            the brand file.
          </p>
        </Card.Body>
      </Card>
      <Alert severity="info" title="Same component">
        Nothing below the semantic layer knows which brand this is.
      </Alert>
      <Switch label="Send me the notes afterwards" defaultChecked />
    </div>
  );
}

/**
 * The two brands side by side, which is the thing the toolbar cannot do.
 *
 * Both columns are pinned rather than following the toolbar selection. An
 * earlier version left the first column on whatever the toolbar said,
 * which made half the page a duplicate of a control already on screen.
 *
 * The columns are deliberately the same width: the coaching column is
 * taller, and that is the density multiplier doing its work rather than a
 * layout accident.
 */
export const SideBySide: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))",
        gap: "2rem",
        alignItems: "start",
      }}
    >
      {BRANDS.map(({ brand, name, voice, changes }) => (
        <section
          key={name}
          data-brand={brand}
          style={{ display: "grid", gap: "1rem" }}
        >
          <div>
            <strong>{name}</strong>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.95rem" }}>{voice}</p>
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.82rem",
                color: "var(--uix-text-secondary)",
              }}
            >
              Re-points {changes}.
            </p>
          </div>
          <Sample />
        </section>
      ))}
    </div>
  ),
};
