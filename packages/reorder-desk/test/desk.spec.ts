import { describe, expect, it } from "vitest";
import { createDesk, reorderPointToolDescriptor } from "../src/index";

const rows = [
  { sku: "4711", name: "Filter coffee 500 g", units: 800, proposed: null },
  { sku: "4712", name: "Espresso beans 1 kg", units: 350, proposed: null },
];

describe("createDesk", () => {
  it("propose marks the row and answers as the tool result text", () => {
    const desk = createDesk(rows);
    const answer = desk.propose("4711", 1240);
    expect(answer).toContain("Proposed 1240 units for SKU 4711");
    expect(answer).toContain("A person confirms on the row.");
    expect(desk.rows()[0]).toEqual({
      sku: "4711",
      name: "Filter coffee 500 g",
      units: 800,
      proposed: 1240,
    });
  });

  it("resolve with accept commits the proposed value", () => {
    const desk = createDesk(rows);
    desk.propose("4712", 500);
    desk.resolve("4712", true);
    expect(desk.rows()[1]).toMatchObject({ units: 500, proposed: null });
  });

  it("resolve without accept keeps the settled value", () => {
    const desk = createDesk(rows);
    desk.propose("4711", 1240);
    desk.resolve("4711", false);
    expect(desk.rows()[0]).toMatchObject({ units: 800, proposed: null });
  });

  it("refuses unknown SKUs and impossible values", () => {
    const desk = createDesk(rows);
    expect(desk.propose("9999", 100)).toContain("Unknown SKU");
    expect(desk.propose("4711", -5)).toContain("non-negative integer");
    expect(desk.propose("4711", 12.5)).toContain("non-negative integer");
  });

  it("snapshots are copies, so callers cannot mutate the desk", () => {
    const desk = createDesk(rows);
    desk.rows()[0]!.units = 1;
    expect(desk.rows()[0]!.units).toBe(800);
  });
});

describe("reorderPointToolDescriptor", () => {
  it("enumerates exactly the SKUs the desk shows", () => {
    const descriptor = reorderPointToolDescriptor(createDesk(rows));
    expect(descriptor.inputSchema.properties.sku).toEqual({
      type: "string",
      enum: ["4711", "4712"],
    });
  });

  it("execute routes into the desk proposal, not into a commit", () => {
    const desk = createDesk(rows);
    const descriptor = reorderPointToolDescriptor(desk);
    const answer = descriptor.execute({ sku: "4711", units: 1240 });
    expect(answer).toContain("A person confirms on the row.");
    expect(desk.rows()[0]).toMatchObject({ units: 800, proposed: 1240 });
  });
});
