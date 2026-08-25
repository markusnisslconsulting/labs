import type { Meta, StoryObj } from "@storybook/react-vite";
import { componentTokens } from "../tokens.registry";
import { TokenTable } from "../foundations/TokenTable";
import { StatusPill } from "./StatusPill";

const meta = {
  title: "Components/StatusPill",
  component: StatusPill,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj;

/** Die Component-Tokens dieses Parts — die Theming-Oberfläche. */
export const Tokens: Story = {
  render: () => (
    <TokenTable
      tokens={componentTokens.filter((token) =>
        token.name.startsWith("--uix-pill-"),
      )}
    />
  ),
};
