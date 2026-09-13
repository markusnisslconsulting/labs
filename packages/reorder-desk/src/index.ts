/** Local proposal state shared by the manual and WebMCP entry points. */
export interface DeskRow {
  sku: string;
  name: string;
  units: number;
  proposed: number | null;
}

export type DeskSnapshot = readonly DeskRow[];

export interface Desk {
  rows(): DeskRow[];
  propose(sku: string, units: number): string;
  resolve(sku: string, accept: boolean): void;
  reset(): void;
}

export function createDesk(
  initialRows: readonly DeskRow[],
  onChange?: (rows: DeskRow[]) => void,
): Desk {
  let rows: DeskRow[] = initialRows.map((row) => ({ ...row }));
  const changed = () => onChange?.(rows.map((row) => ({ ...row })));

  return {
    rows: () => rows.map((row) => ({ ...row })),

    propose(sku, units) {
      const row = rows.find((candidate) => candidate.sku === sku);
      if (!row) {
        return `Unknown SKU ${sku}.`;
      }
      if (!Number.isSafeInteger(units) || units < 0) {
        return `Reorder point for ${sku} must be a non-negative integer.`;
      }
      row.proposed = units;
      changed();
      return `Proposed ${units} units for SKU ${sku}. A person confirms on the row.`;
    },

    resolve(sku, accept) {
      const row = rows.find((candidate) => candidate.sku === sku);
      if (!row || row.proposed === null) {
        return;
      }
      if (accept) {
        row.units = row.proposed;
      }
      row.proposed = null;
      changed();
    },
    reset() {
      rows = initialRows.map((row) => ({ ...row }));
      changed();
    },
  };
}

export interface ToolDescriptorInput {
  sku: string;
  units: number;
}

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(input: Record<string, unknown>): string;
}

/**
 * The declared verb. The schema enumerates the SKUs the desk actually
 * has, so the description cannot promise an action for a product the
 * page never shows.
 */
export function reorderPointToolDescriptor(desk: Desk): ToolDescriptor {
  const skus = desk.rows().map((row) => row.sku);
  return {
    name: "propose_reorder_point",
    description:
      "Propose a reorder point for one SKU. A person accepts or discards the proposal on the page.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", enum: skus },
        units: { type: "integer", minimum: 0 },
      },
      required: ["sku", "units"],
    },
    execute(input: Record<string, unknown>) {
      const { sku, units } = input;
      if (typeof sku !== "string" || typeof units !== "number") {
        return "Provide a string SKU and a numeric reorder point.";
      }
      return desk.propose(sku, units);
    },
  };
}
