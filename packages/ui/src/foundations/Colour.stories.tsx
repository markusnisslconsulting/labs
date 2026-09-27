import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColourSpecimens } from "../../.storybook/brand/BrandSpecimens";

const meta = {
  title: "Foundations/Colour",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => <ColourSpecimens />,
};
