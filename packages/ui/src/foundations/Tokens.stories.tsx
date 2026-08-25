import type { Meta, StoryObj } from "@storybook/react-vite";
import { primitiveTokens, semanticTokens } from "../tokens.registry";
import { TokenTable } from "./TokenTable";

const meta = {
  title: "Foundations/Tokens/Overview",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Rohwerte: Palette, Radien, Abstände, Typografie. Komponenten
    referenzieren diese Ebene nie direkt. Klick auf einen Namen
    kopiert ihn. */
export const Primitive: Story = {
  render: () => <TokenTable tokens={primitiveTokens} />,
};

/** Intent statt Aussehen — die Schicht, die ein Produkt überschreibt
    (Rebranding, Dark Mode). */
export const Semantic: Story = {
  render: () => <TokenTable tokens={semanticTokens} />,
};
