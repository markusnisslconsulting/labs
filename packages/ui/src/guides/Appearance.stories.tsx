import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DensityScopes,
  NestedDirection,
  PortalScopes,
} from "../../.storybook/examples/Appearance";

const meta = {
  title: "Guides/Appearance examples",
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Density: Story = { render: () => <DensityScopes /> };
export const Portals: Story = { render: () => <PortalScopes /> };
export const LocalLTR: Story = {
  render: () => <NestedDirection direction="ltr" />,
};
export const LocalRTL: Story = {
  render: () => <NestedDirection direction="rtl" />,
};
