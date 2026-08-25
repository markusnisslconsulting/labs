import { componentTokens } from "../tokens.registry";

const meta = {
  title: "Foundations/Tokens/Component",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

/**
 * The theming surface per part. A product overrides these to restyle
 * a component without touching the system; every one falls back
 * through the semantic layer.
 */
export function ComponentTokensStory() {
  const groups = new Map<string, typeof componentTokens>();
  for (const token of componentTokens) {
    const part = token.name.replace("--uix-", "").split("-")[0] ?? "misc";
    groups.set(part, [...(groups.get(part) ?? []), token]);
  }

  return (
    <div style={{ display: "grid", gap: "1.6rem" }}>
      {[...groups.entries()].map(([part, tokens]) => (
        <section key={part}>
          <h3 style={{ margin: "0 0 0.5rem" }}>{part}</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tokens.map((token) => (
              <li key={token.name} style={{ marginBottom: "0.35rem" }}>
                <code>{token.name}</code>{" "}
                <span
                  style={{
                    color: "var(--uix-text-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  = <code>{token.value}</code> · {token.description}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
