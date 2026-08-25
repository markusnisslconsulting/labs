import type { Meta, StoryObj } from "@storybook/react-vite";
import { componentTokens } from "../tokens.registry";
import { TokenTable } from "../foundations/TokenTable";
import { Chip } from "./Chip";

const meta = {
  title: "Foundations/Tokens/Slots/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj;

/** Die Component-Tokens dieses Parts — die Theming-Oberfläche. */
export const Tokens: Story = {
  render: () => (
    <TokenTable
      tokens={componentTokens.filter((token) =>
        token.name.startsWith("--uix-chip-"),
      )}
    />
  ),
};
