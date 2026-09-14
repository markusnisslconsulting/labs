import { describe, expect, it } from "vitest";
import { createDesk, reorderPointToolDescriptor } from "../src/index";
const rows = [{ sku: "4711", name: "Filter coffee 500 g", units: 800 }];

describe("the inventory operation", () => {
  it("updates the record and returns its actual previous and new values", () => {
    const desk = createDesk(rows);
    expect(
      JSON.parse(desk.setReorderPoint({ sku: "4711", units: 1240 })),
    ).toEqual({ ok: true, sku: "4711", previousUnits: 800, units: 1240 });
    const tool = reorderPointToolDescriptor(desk);
    expect(JSON.parse(tool.execute({ sku: "4711", units: 900 }))).toEqual({
      ok: true,
      sku: "4711",
      previousUnits: 1240,
      units: 900,
    });
    expect(desk.rows()[0]?.units).toBe(900);
  });
  it.each([
    { sku: "unknown", units: 900 },
    { sku: 4711, units: 900 },
    { sku: "4711", units: -1 },
    { sku: "4711", units: 12.5 },
    { sku: "4711", units: "900" },
    { sku: "4711", units: Infinity },
    { sku: "4711", units: Number.MAX_SAFE_INTEGER + 1 },
  ])("refuses invalid arguments without changing inventory: %j", (input) => {
    const desk = createDesk(rows);
    expect(JSON.parse(reorderPointToolDescriptor(desk).execute(input)).ok).toBe(
      false,
    );
    expect(desk.rows()).toEqual(rows);
  });
  it("keeps the registered operation connected to visible state across reset", () => {
    let visible = rows;
    const desk = createDesk(rows, (next) => {
      visible = next;
    });
    const tool = reorderPointToolDescriptor(desk);
    tool.execute({ sku: "4711", units: 1240 });
    expect(visible[0]?.units).toBe(1240);
    desk.reset();
    expect(visible[0]?.units).toBe(800);
    tool.execute({ sku: "4711", units: 900 });
    expect(visible[0]?.units).toBe(900);
    desk.rows()[0]!.units = 1;
    expect(desk.rows()[0]?.units).toBe(900);
  });
});
