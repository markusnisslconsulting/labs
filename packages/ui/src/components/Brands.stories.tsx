import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Switch } from "./Switch";

const meta = {
  title: "Foundations/Brands",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Multi-brand proof: the semantic layer is the only thing a second
 * brand overrides. Both cards below render the same components; the
 * right one runs under `data-brand="ocean"`.
 */
export const SideBySide: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
      <div style={{ display: "grid", gap: "0.8rem", justifyItems: "start" }}>
        <strong>Default (red)</strong>
        <Button>Primary action</Button>
        <Alert severity="info" title="Info">
          Same components, brand tokens.
        </Alert>
        <Switch label="Compact rows" defaultChecked />
      </div>
      <div data-brand="ocean" style={{ display: "grid", gap: "0.8rem", justifyItems: "start" }}>
        <strong>Ocean (blue)</strong>
        <Button>Primary action</Button>
        <Alert severity="info" title="Info">
          Same components, brand tokens.
        </Alert>
        <Switch label="Compact rows" defaultChecked />
      </div>
    </div>
  ),
};
