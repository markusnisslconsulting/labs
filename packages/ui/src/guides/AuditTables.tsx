import { WCAG_22_AA, type CriterionStatus } from "../audit/wcag";
import { PAIRINGS, SCREEN_READER_MATRIX } from "../audit/screen-readers";

/**
 * The two audit records, rendered from the files the check reads.
 *
 * Not a second copy. `nx run ui:audit` reads `src/audit/wcag.ts` and
 * `src/audit/screen-readers.ts`, and so does this — so a row cannot
 * appear on the page without the check seeing it, and the count of
 * unchecked screen-reader cells on the page is the same number the gate
 * prints.
 */

const STATUS_LABEL: Record<CriterionStatus, string> = {
  gate: "a check fails",
  manual: "a person has to look",
  product: "the product's",
  "n/a": "cannot apply",
};

const STATUS_TONE: Record<CriterionStatus, string> = {
  gate: "var(--uix-status-ok)",
  manual: "var(--uix-status-warn)",
  product: "var(--uix-text-secondary)",
  "n/a": "var(--uix-text-disabled)",
};

export function WcagTable() {
  const groups = ["gate", "manual", "product", "n/a"] as const;
  return (
    <div style={{ display: "grid", gap: "var(--uix-space-5)" }}>
      {groups.map((status) => {
        const rows = WCAG_22_AA.filter(
          (criterion) => criterion.status === status,
        );
        return (
          <section key={status}>
            <h3 style={{ marginBottom: "var(--uix-space-2)" }}>
              {STATUS_LABEL[status]}{" "}
              <span
                style={{
                  color: "var(--uix-text-secondary)",
                  fontWeight: "normal",
                  fontSize: "var(--uix-font-size-200)",
                }}
              >
                {rows.length}
              </span>
            </h3>
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {rows.map((criterion) => (
                <div
                  key={criterion.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "3.4rem minmax(9rem, 14rem) minmax(0, 1fr)",
                    gap: "var(--uix-space-3)",
                    alignItems: "baseline",
                    padding: "0.3rem 0.4rem",
                    borderRadius: "var(--uix-radius-inset)",
                  }}
                >
                  <code
                    style={{
                      fontFamily: "var(--uix-font-mono)",
                      fontSize: "var(--uix-font-size-100)",
                      color: STATUS_TONE[status],
                    }}
                  >
                    {criterion.id}
                  </code>
                  <span style={{ fontSize: "var(--uix-font-size-200)" }}>
                    {criterion.name}
                    {criterion.new22 ? (
                      <span
                        style={{
                          color: "var(--uix-text-secondary)",
                          fontSize: "var(--uix-font-size-100)",
                        }}
                      >
                        {" "}
                        new in 2.2
                      </span>
                    ) : null}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--uix-font-size-100)",
                      color: "var(--uix-text-secondary)",
                    }}
                  >
                    {criterion.evidence}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ScreenReaderTable() {
  const cells = SCREEN_READER_MATRIX.length * PAIRINGS.length;
  const checked = SCREEN_READER_MATRIX.flatMap((row) =>
    PAIRINGS.map((pairing) => row.cells[pairing.id]),
  ).filter((cell) => cell.checked !== null).length;

  return (
    <div style={{ display: "grid", gap: "var(--uix-space-4)" }}>
      <p style={{ margin: 0 }}>
        <strong>
          {checked} of {cells} cells checked.
        </strong>{" "}
        {checked === 0
          ? "Nobody has run a screen reader against this library yet. The " +
            "table below is the list to work through, in the order to work " +
            "through it."
          : "The oldest pass and the gaps are printed by nx run ui:audit."}
      </p>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(7rem, 9rem) repeat(3, 7rem) 1fr",
            gap: "var(--uix-space-3)",
            fontSize: "var(--uix-font-size-100)",
            color: "var(--uix-text-secondary)",
            fontFamily: "var(--uix-font-ui)",
            padding: "0 0.4rem",
          }}
        >
          <span>Component</span>
          {PAIRINGS.map((pairing) => (
            <span key={pairing.id}>{pairing.label}</span>
          ))}
          <span>Why it is on the list</span>
        </div>
        {SCREEN_READER_MATRIX.map((row) => (
          <div
            key={row.component}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(7rem, 9rem) repeat(3, 7rem) 1fr",
              gap: "var(--uix-space-3)",
              alignItems: "baseline",
              padding: "0.3rem 0.4rem",
              borderRadius: "var(--uix-radius-inset)",
            }}
          >
            <span style={{ fontSize: "var(--uix-font-size-200)" }}>
              {row.component}
            </span>
            {PAIRINGS.map((pairing) => {
              const cell = row.cells[pairing.id];
              return (
                <span
                  key={pairing.id}
                  style={{
                    fontSize: "var(--uix-font-size-100)",
                    fontVariantNumeric: "tabular-nums",
                    color: cell.checked
                      ? "var(--uix-text-primary)"
                      : "var(--uix-text-disabled)",
                  }}
                >
                  {cell.checked ?? "not yet"}
                </span>
              );
            })}
            <span
              style={{
                fontSize: "var(--uix-font-size-100)",
                color: "var(--uix-text-secondary)",
              }}
            >
              {row.why}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
