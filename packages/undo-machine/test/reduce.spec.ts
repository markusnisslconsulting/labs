import { describe, expect, it } from "vitest";
import {
  createReorderStore,
  reduceRow,
  type RowState,
  type Write,
} from "../src/index";
const request: Write = { units: 1240, expectedVersion: 1, action: "change" };
function setup() {
  const store = createReorderStore();
  let row: RowState = { kind: "settled", current: store.read() };
  return {
    store,
    get row() {
      return row;
    },
    dispatch(event: Parameters<typeof reduceRow>[1]) {
      row = reduceRow(row, event);
    },
    save() {
      row = reduceRow(row, { type: "person-accepted" });
      if (row.kind !== "saving")
        throw new Error("A reviewed proposal is required");
      row = reduceRow(row, {
        type: "write-returned",
        result: store.write(row.proposal),
      });
    },
  };
}
describe("proposal and save", () => {
  it("proposal and rejection leave the stored value unchanged", () => {
    const demo = setup();
    demo.dispatch({ type: "agent-proposed", units: 1240 });
    expect(demo.store.read()).toEqual({ units: 800, version: 1 });
    demo.dispatch({ type: "person-rejected" });
    expect(demo.row).toEqual({
      kind: "settled",
      current: { units: 800, version: 1 },
    });
    expect(demo.store.history()).toEqual([]);
  });
  it("does not report saved until the store returns a receipt", () => {
    const demo = setup();
    demo.dispatch({ type: "agent-proposed", units: 1240 });
    demo.dispatch({ type: "person-accepted" });
    expect(demo.row.kind).toBe("saving");
    expect(demo.store.read().units).toBe(800);
    demo.dispatch({
      type: "write-returned",
      result: demo.store.write(request),
    });
    expect(demo.row.kind).toBe("saved");
    expect(demo.row.current).toEqual(demo.store.read());
  });
  it("a definite refusal keeps the proposal available to retry", () => {
    const demo = setup();
    demo.dispatch({ type: "agent-proposed", units: 1240 });
    demo.dispatch({ type: "person-accepted" });
    demo.dispatch({
      type: "write-returned",
      result: { kind: "refused", reason: "unavailable" },
    });
    expect(demo.row).toMatchObject({
      kind: "proposed",
      error: "unavailable",
      proposal: request,
    });
    expect(demo.store.history()).toEqual([]);
    demo.save();
    expect(demo.store.read().units).toBe(1240);
  });
  it("requires another review when a colleague edits before save", () => {
    const demo = setup();
    demo.dispatch({ type: "agent-proposed", units: 1240 });
    demo.store.write({ ...request, units: 900 }, "colleague");
    demo.save();
    expect(demo.row).toMatchObject({
      kind: "conflict",
      current: { units: 900, version: 2 },
    });
    demo.dispatch({ type: "person-accepted" });
    expect(demo.row.kind).toBe("conflict");
    expect(demo.store.read().units).toBe(900);
    demo.dispatch({ type: "person-reviewed-conflict" });
    expect(demo.store.read().units).toBe(900);
    demo.save();
    expect(demo.store.read()).toEqual({ units: 1240, version: 3 });
  });
});
describe("restoring a saved value", () => {
  it("requires a new save and records both writes", () => {
    const demo = setup();
    demo.dispatch({ type: "agent-proposed", units: 1240 });
    demo.save();
    demo.dispatch({ type: "person-undid" });
    expect(demo.row).toMatchObject({
      kind: "proposed",
      proposal: { units: 800, expectedVersion: 2, action: "restore" },
    });
    expect(demo.store.read().units).toBe(1240);
    demo.save();
    expect(demo.store.read()).toEqual({ units: 800, version: 3 });
    expect(
      demo.store
        .history()
        .map(({ before, after, action }) => [
          before.units,
          after.units,
          action,
        ]),
    ).toEqual([
      [800, 1240, "change"],
      [1240, 800, "restore"],
    ]);
  });
  it("does not silently undo a colleague's later edit", () => {
    const demo = setup();
    demo.dispatch({ type: "agent-proposed", units: 1240 });
    demo.save();
    demo.store.write(
      { units: 1000, expectedVersion: 2, action: "change" },
      "colleague",
    );
    demo.dispatch({ type: "person-undid" });
    demo.save();
    expect(demo.row).toMatchObject({
      kind: "conflict",
      current: { units: 1000, version: 3 },
    });
    expect(demo.store.read().units).toBe(1000);
    expect(demo.store.history()).toHaveLength(2);
  });
});
describe("store validation", () => {
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "refuses invalid units %s without a write",
    (units) => {
      const store = createReorderStore();
      expect(store.write({ ...request, units })).toEqual({
        kind: "refused",
        reason: "invalid-units",
      });
      expect(store.read()).toEqual({ units: 800, version: 1 });
      expect(store.history()).toEqual([]);
    },
  );
  it("returns a conflict on a repeated stale request", () => {
    const store = createReorderStore();
    store.write(request);
    expect(store.write(request).kind).toBe("conflict");
    expect(store.history()).toHaveLength(1);
  });
});

it("returned receipts and history cannot mutate the stored snapshots", () => {
  const store = createReorderStore();
  const result = store.write(request);
  if (result.kind !== "saved") throw new Error("Expected a saved receipt");
  result.receipt.before.units = 0;
  result.receipt.after.units = 0;
  const history = store.history();
  history[0]!.after.units = 1;
  history.length = 0;
  expect(store.read()).toEqual({ units: 1240, version: 2 });
  expect(store.history()[0]).toMatchObject({
    before: { units: 800, version: 1 },
    after: { units: 1240, version: 2 },
  });
});
