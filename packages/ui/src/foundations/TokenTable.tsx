import type { TokenDescriptor } from "../tokens.registry";

/** Klick kopiert den Namen — der haeufigste naechste Schritt. */
function copyName(name: string) {
  void navigator.clipboard?.writeText(name).catch(() => {});
}

function Preview({ token }: { token: TokenDescriptor }) {
  switch (token.type) {
    case "color":
      return (
        <span
          style={{
            width: "2.6rem",
            height: "2.6rem",
            borderRadius: "var(--uix-radius-s)",
            border: "1px solid var(--uix-border-subtle)",
            background: token.value,
            display: "inline-block",
            flexShrink: 0,
          }}
          aria-hidden
        />
      );
    case "radius":
      return (
        <span
          style={{
            width: "2.6rem",
            height: "2.6rem",
            border: "2px solid var(--uix-accent)",
            borderTopLeftRadius: token.value,
            borderTopRightRadius: token.value,
            display: "inline-block",
            flexShrink: 0,
          }}
          aria-hidden
        />
      );
    case "space":
      return (
        <span
          style={{
            display: "inline-block",
            width: "8rem",
            height: "0.9rem",
            background: "var(--uix-bg-subtle)",
            borderRadius: "var(--uix-radius-s)",
            position: "relative",
          }}
          aria-hidden
        >
          <span
            style={{
              position: "absolute",
              inset: "0 auto 0 0",
              width: token.value,
              minWidth: "3px",
              background: "var(--uix-accent)",
              borderRadius: "inherit",
            }}
          />
        </span>
      );
    case "typography": {
      if (token.name.includes("family")) {
        return (
          <span style={{ fontFamily: token.value, fontSize: "1.2rem" }}>
            Aa
          </span>
        );
      }
      if (token.name.includes("weight")) {
        return <span style={{ fontWeight: Number(token.value) }}>Aa</span>;
      }
      if (token.name.includes("line-height")) {
        return <span style={{ lineHeight: Number(token.value) }}>Aa Aa</span>;
      }
      return <span style={{ fontSize: token.value }}>Aa</span>;
    }
    case "elevation":
      return (
        <span
          style={{
            width: "3rem",
            height: "2rem",
            borderRadius: "var(--uix-radius-s)",
            background: "var(--uix-bg-surface)",
            boxShadow: token.value,
            display: "inline-block",
          }}
          aria-hidden
        />
      );
    case "opacity":
      // Fläche statt Text: ein Opacity-Specimen aus Text verletzt die
      // Kontrast-Regel per Konstruktion.
      return (
        <span
          style={{
            display: "inline-block",
            width: "4rem",
            height: "1.4rem",
            borderRadius: "var(--uix-radius-s)",
            background:
              "repeating-linear-gradient(45deg, var(--uix-bg-subtle) 0 6px, var(--uix-bg-surface) 6px 12px)",
            position: "relative",
          }}
          aria-hidden
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background: "var(--uix-accent)",
              opacity: Number(token.value),
            }}
          />
        </span>
      );
    default:
      return (
        <code style={{ fontVariantNumeric: "tabular-nums" }}>
          {token.value}
        </code>
      );
  }
}

/**
 * Token-Tabelle mit typgerechter Vorschau (Farbe = Swatch, Radius =
 * Form, Space = Balken, Typografie = Specimen, Elevation = Schatten).
 * Klick auf den Namen kopiert ihn.
 */
export function TokenTable({ tokens }: { tokens: TokenDescriptor[] }) {
  return (
    <div style={{ display: "grid", gap: "0.45rem" }}>
      {tokens.map((token) => (
        <div
          key={token.name}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(14rem, 1.2fr) 5rem 2fr 2fr",
            gap: "var(--uix-space-3)",
            alignItems: "center",
            padding: "0.35rem 0.5rem",
            borderRadius: "var(--uix-radius-s)",
          }}
        >
          <button
            type="button"
            title="Click to copy the token name"
            onClick={() => copyName(token.name)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              color: "var(--uix-text-primary)",
              textAlign: "left",
              cursor: "copy",
              fontFamily: "var(--uix-font-mono)",
              fontSize: "var(--uix-font-size-200)",
            }}
          >
            {token.name}
          </button>
          <Preview token={token} />
          <span
            style={{
              fontSize: "var(--uix-font-size-200)",
              color: "var(--uix-text-secondary)",
            }}
          >
            {token.description}
          </span>
          <code
            style={{
              fontSize: "var(--uix-font-size-100)",
              color: "var(--uix-text-secondary)",
            }}
          >
            {token.value}
          </code>
        </div>
      ))}
    </div>
  );
}
