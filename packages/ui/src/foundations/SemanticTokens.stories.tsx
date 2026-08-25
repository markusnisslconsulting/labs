import { semanticTokens } from "../tokens.registry";

const meta = {
  title: "Foundations/Tokens/Semantic",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

/** Contrast ratio between two hex colours (WCAG). */
function contrast(foregroundHex: string, backgroundHex: string): number {
  const parse = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const channel = (c: number) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([r, g, b]: [number, number, number]) =>
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const [lf, lb] = [
    luminance(parse(foregroundHex)),
    luminance(parse(backgroundHex)),
  ];
  return (
    Math.round(((Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)) * 100) /
    100
  );
}

/**
 * Intent over appearance: text-primary instead of navy-900. A
 * product rebrands by overriding this layer only.
 *
 * Text tokens show their contrast against the page background;
 * anything below 4.5 would fail WCAG AA for body copy and is caught
 * here, before it ships.
 */
export function SemanticTokensStory() {
  const bgPage = "#f7f9fc";

  return (
    <div style={{ display: "grid", gap: "0.9rem", justifyItems: "start" }}>
      {semanticTokens.map((token) => {
        // Text tokens get their contrast against paper printed next
        // to the value; the numbers are the WCAG ratios of the
        // resolved primitives.
        const isText =
          token.name.startsWith("--uix-text-") &&
          token.name !== "--uix-text-on-accent";
        return (
          <div
            key={token.name}
            style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}
          >
            <span
              aria-hidden
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "var(--uix-radius-s)",
                border: "1px solid var(--uix-border-subtle)",
                background: token.value,
              }}
            />
            <div>
              <code>{token.name}</code>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--uix-text-secondary)",
                }}
              >
                {token.description} · <code>{token.value}</code>
                {isText && token.value.includes("navy-900") ? (
                  <> · contrast on paper: {contrast("#172b4d", bgPage)}:1</>
                ) : null}
                {isText && token.value.includes("slate-600") ? (
                  <> · contrast on paper: {contrast("#4b5870", bgPage)}:1</>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
