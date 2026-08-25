import type { Meta, StoryObj } from "@storybook/react-vite";
import { componentTokens } from "../tokens.registry";
import { TokenTable } from "../foundations/TokenTable";
import { SearchInput } from "./SearchInput";

const meta = {
  title: "Foundations/Tokens/Slots/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj;

/** Die Component-Tokens dieses Parts — die Theming-Oberfläche. */
export const Tokens: Story = {
  render: () => (
    <TokenTable
      tokens={componentTokens.filter((token) =>
        token.name.startsWith("--uix-search-"),
      )}
    />
  ),
};
