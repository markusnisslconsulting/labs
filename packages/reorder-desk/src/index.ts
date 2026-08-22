/**
 * The ordering desk from "Declare Your Product's Verbs", as data and
 * functions instead of a component. The desk owns its rows; the tool
 * descriptor is what a page hands to
 * `document.modelContext.registerTool` so an agent can call the same
 * verb the Save button calls.
 *
 * One function with two callers: that is the whole drift defence.
 */
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
}

export function createDesk(initialRows: readonly DeskRow[]): Desk {
  const rows: DeskRow[] = initialRows.map((row) => ({ ...row }));

  return {
    rows: () => rows.map((row) => ({ ...row })),

    propose(sku, units) {
      const row = rows.find((candidate) => candidate.sku === sku);
      if (!row) {
        return `Unknown SKU ${sku}.`;
      }
      if (!Number.isInteger(units) || units < 0) {
        return `Reorder point for ${sku} must be a non-negative integer.`;
      }
      row.proposed = units;
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
    name: "set_reorder_point",
    description:
      "Set the reorder point for one SKU on this demo ordering desk. The person can review and undo.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", enum: skus },
        units: { type: "integer", minimum: 0 },
      },
      required: ["sku", "units"],
    },
    execute(input: Record<string, unknown>) {
      const { sku, units } = input as unknown as ToolDescriptorInput;
      return desk.propose(sku, units);
    },
  };
}
