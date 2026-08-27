import { KEYBOARD_MAP, type KeyboardRow } from "../keyboard.map";

/**
 * The keyboard map, rendered from the file the tests read.
 *
 * Deliberately not a second copy. A keyboard table written by hand in MDX
 * is a table that goes stale the first time a key changes, and the
 * failure is silent — the docs keep promising the old behaviour. This
 * reads `src/keyboard.map.ts`, which is also the input to
 * `browser/keyboard.spec.ts`, so a row cannot appear here without a test
 * and cannot pass a test without appearing here.
 */
function byComponent(rows: KeyboardRow[]) {
  const groups = new Map<string, KeyboardRow[]>();
  for (const row of rows) {
    const list = groups.get(row.component) ?? [];
    list.push(row);
    groups.set(row.component, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function KeyboardTable() {
  return (
    <div style={{ display: "grid", gap: "var(--uix-space-5)" }}>
      {byComponent(KEYBOARD_MAP).map(([component, rows]) => (
        <section key={component}>
          <h3 style={{ marginBottom: "var(--uix-space-2)" }}>{component}</h3>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {rows.map((row) => (
              <div
                key={`${row.component}-${row.key}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(6rem, 8rem) minmax(0, 1fr) minmax(5rem, 7rem)",
                  gap: "var(--uix-space-3)",
                  alignItems: "baseline",
                  padding: "0.3rem 0.4rem",
                  borderRadius: "var(--uix-radius-inset)",
                }}
              >
                <kbd
                  style={{
                    fontFamily: "var(--uix-font-mono)",
                    fontSize: "var(--uix-font-size-200)",
                  }}
                >
                  {row.key}
                </kbd>
                <span style={{ fontSize: "var(--uix-font-size-200)" }}>
                  {row.expectation}
                </span>
                <span
                  style={{
                    fontSize: "var(--uix-font-size-100)",
                    color: "var(--uix-text-secondary)",
                    fontFamily: "var(--uix-font-ui)",
                  }}
                >
                  {row.owner === "platform" ? "the browser" : "the component"}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
