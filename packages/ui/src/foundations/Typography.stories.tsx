import type { Meta, StoryObj } from "@storybook/react-vite";
import { TypographySpecimens } from "../../.storybook/brand/BrandSpecimens";

const meta = {
  title: "Foundations/Typography",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => <TypographySpecimens />,
};
