import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./Panel";

const meta = {
  title: "Primitives/Panel",
  component: Panel,
  tags: ["autodocs"],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A named landmark: screen reader users can jump to it by label. */
export const Default: Story = {
  args: {
    label: "Live · transcript versus control surface",
    children: <p>Demo content sits inside the bordered surface.</p>,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("region", {
        name: "Live · transcript versus control surface",
      }),
    ).toBeVisible();
  },
};
