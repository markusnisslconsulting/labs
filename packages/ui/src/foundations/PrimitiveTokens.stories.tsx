import { primitiveTokens, type TokenDescriptor } from "../tokens.registry";

const meta = {
  title: "Foundations/Tokens",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

function Swatch({ token }: { token: TokenDescriptor }) {
  const isColour = token.type === "color";
  return (
    <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
      <span
        aria-hidden
        style={{
          width: "3rem",
          height: "3rem",
          borderRadius: "var(--uix-radius-s)",
          border: "1px solid var(--uix-border-subtle)",
          background: isColour ? token.value : "transparent",
          flexShrink: 0,
        }}
      />
      <div>
        <code>{token.name}</code>
        <div style={{ fontSize: "0.9rem", color: "var(--uix-text-secondary)" }}>
          {token.description} · <code>{token.value}</code>
        </div>
      </div>
    </div>
  );
}

/**
 * Raw values with no opinion. Components never reference these
 * directly; the semantic layer does. Shown here so the palette is
 * visible without reading CSS.
 */
export const PrimitiveTokensStory = {
  render: () => (
    <div style={{ display: "grid", gap: "0.9rem", justifyItems: "start" }}>
      {primitiveTokens.map((token) => (
        <Swatch key={token.name} token={token} />
      ))}
    </div>
  ),
};
