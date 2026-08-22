import { useState } from "react";

/** The colour tokens from styles/tokens.css, by name. */
interface TokenSpec {
  name: string;
  usage: string;
  /** Whether text is expected to sit on this token's background. */
  carriesText?: boolean;
}

const TOKENS: TokenSpec[] = [
  {
    name: "--color-ink",
    usage: "Primary text and solid fills",
    carriesText: false,
  },
  { name: "--color-mute", usage: "Secondary text", carriesText: true },
  {
    name: "--color-seal",
    usage: "Accent, focus ring, primary button",
    carriesText: false,
  },
  { name: "--color-rule", usage: "Hairline borders", carriesText: false },
  {
    name: "--color-feld",
    usage: "Quiet surfaces, chips, code background",
    carriesText: true,
  },
  { name: "--color-paper", usage: "Page background", carriesText: true },
];

/** WCAG contrast ratio between two resolved colours. */
function contrast(a: string, b: string): number | null {
  const parse = (value: string): [number, number, number] | null => {
    const match = value.match(/(\d+), (\d+), (\d+)/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  };
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return null;
  const lin = ([r, g, b]: [number, number, number]) =>
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  function channel(c: number): number {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  }
  const la = lin(ca);
  const lb = lin(cb);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return Math.round(ratio * 100) / 100;
}

const meta = {
  title: "Foundations/Colour tokens",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

/**
 * Every token is read live from the computed style of this page, so
 * the swatches cannot drift from `styles/tokens.css`. Text tokens
 * show their contrast ratio against the paper background; anything
 * below 4.5 would fail WCAG AA for body copy.
 */
export function Colours() {
  // Lazy initialiser: tokens are read once, at first render, straight
  // from the computed style — no effect, no cascading renders.
  const [resolved] = useState<Record<string, string>>(() => {
    const styles = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const token of TOKENS) {
      next[token.name] = styles.getPropertyValue(token.name).trim();
    }
    return next;
  });

  const paper = resolved["--color-paper"] ?? "";

  return (
    <div style={{ display: "grid", gap: "0.9rem", justifyItems: "start" }}>
      {TOKENS.map((token) => {
        const value = resolved[token.name] ?? "…";
        const ratio =
          token.carriesText && paper ? contrast(value, paper) : null;
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
                borderRadius: "0.7rem",
                border: "1px solid var(--color-rule)",
                background: value === "…" ? "transparent" : value,
                display: "inline-block",
              }}
            />
            <div>
              <code>{token.name}</code>
              <div style={{ fontSize: "0.9rem", color: "var(--color-mute)" }}>
                {token.usage}
                {value !== "…" ? <> · {value}</> : null}
                {ratio !== null ? <> · contrast on paper: {ratio}:1</> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
