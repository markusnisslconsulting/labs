/** In-memory inventory record used by both the form and the page tool. */
export interface DeskRow {
  sku: string;
  name: string;
  units: number;
}

export interface Desk {
  rows(): DeskRow[];
  setReorderPoint(input: Record<string, unknown>): string;
  reset(): void;
}

export function createDesk(
  initialRows: readonly DeskRow[],
  onChange?: (rows: DeskRow[]) => void,
): Desk {
  let rows = initialRows.map((row) => ({ ...row }));
  const snapshot = () => rows.map((row) => ({ ...row }));
  return {
    rows: snapshot,
    setReorderPoint({ sku, units }) {
      const row = rows.find((candidate) => candidate.sku === sku);
      if (!row) return JSON.stringify({ ok: false, error: "Unknown SKU." });
      if (
        typeof units !== "number" ||
        !Number.isSafeInteger(units) ||
        units < 0
      ) {
        return JSON.stringify({
          ok: false,
          error: "Units must be a non-negative safe integer.",
        });
      }
      const previousUnits = row.units;
      row.units = units;
      onChange?.(snapshot());
      return JSON.stringify({ ok: true, sku, previousUnits, units });
    },
    reset() {
      rows = initialRows.map((row) => ({ ...row }));
      onChange?.(snapshot());
    },
  };
}

export function reorderPointToolDescriptor(desk: Desk) {
  return {
    name: "set_reorder_point",
    description: "Set the reorder point for product 4711 in this demo.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", enum: desk.rows().map((row) => row.sku) },
        units: { type: "integer", minimum: 0 },
      },
      required: ["sku", "units"],
      additionalProperties: false,
    },
    execute: (input: Record<string, unknown>) => desk.setReorderPoint(input),
  };
}
