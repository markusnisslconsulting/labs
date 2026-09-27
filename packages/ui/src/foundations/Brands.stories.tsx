import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Columns } from "../components/Columns";
import { Stack } from "../components/Stack";
import { Cluster } from "../components/Cluster";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { TextField } from "../components/TextField";
import "./Brands.css";

const meta = {
  title: "Foundations/Brands",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function BrandExample({ brand }: { brand: "consulting" | "coaching" }) {
  const [saved, setSaved] = useState(false);
  const name = brand === "consulting" ? "Consulting" : "Coaching";
  return (
    <Panel data-brand={brand} className="brand-example" aria-label={name}>
      <Stack gap="lg">
        <Cluster justify="between">
          <span className="brand-example-logo" aria-hidden="true" />
          <Badge>{name}</Badge>
        </Cluster>
        <Stack gap="sm">
          <h2 data-face="display">Make room for better work</h2>
          <p data-face="body">
            A fictional workshop helps a small team turn a question into a
            practical next step. Body text includes clear distinctions: I l 1, O
            0, and Ä Ö Ü.
          </p>
          <p>
            <em>Pause, read the evidence, then choose the next step.</em>
          </p>
        </Stack>
        <TextField label="Workshop name" defaultValue="Harbour workshop" />
        <Cluster gap="sm">
          <Button
            disabled={false}
            loading={false}
            onClick={() => setSaved(true)}
          >
            Save example
          </Button>
          <Button variant="outline" onClick={() => setSaved(false)}>
            Reset
          </Button>
          <Button disabled>Unavailable</Button>
        </Cluster>
        <p role="status">
          {saved ? "Example saved locally." : "No changes saved."}
        </p>
        <Panel className="brand-example-raised">
          <Stack gap="sm">
            <strong>Shared parts, different roles</strong>
            <p>Spacing, corners, elevation and type follow the brand scope.</p>
          </Stack>
        </Panel>
      </Stack>
    </Panel>
  );
}

export const Comparison: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <Columns min="lg" gap="lg">
      <BrandExample brand="consulting" />
      <BrandExample brand="coaching" />
    </Columns>
  ),
};
