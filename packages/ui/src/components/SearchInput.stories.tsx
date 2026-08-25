import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchInput } from "./SearchInput";

const meta = {
  title: "Components/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Search the labs", "aria-label": "Search the labs" },
  play: async ({ canvas }) => {
    // The accessible name comes from the label, never the placeholder.
    await expect(
      canvas.getByRole("searchbox", { name: "Search the labs" }),
    ).toBeVisible();
  },
};
