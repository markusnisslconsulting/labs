import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";

const meta = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SupplierRegion: Story = {
  args: {
    label: "Supplier region",
    hint: "Determines delivery windows.",
    options: [
      { value: "eu", label: "European Union" },
      { value: "uk", label: "United Kingdom" },
      { value: "us", label: "United States" },
    ],
  },
};
