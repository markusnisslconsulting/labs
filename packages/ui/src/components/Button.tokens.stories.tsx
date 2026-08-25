import type { Meta, StoryObj } from "@storybook/react-vite";
import { componentTokens } from "../tokens.registry";
import { TokenTable } from "../foundations/TokenTable";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj;

/** Die Component-Tokens dieses Parts — die Theming-Oberfläche. */
export const Tokens: Story = {
  render: () => (
    <TokenTable
      tokens={componentTokens.filter((token) =>
        token.name.startsWith("--uix-button-"),
      )}
    />
  ),
};
