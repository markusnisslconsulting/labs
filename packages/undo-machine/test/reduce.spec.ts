import { describe, expect, it } from "vitest";
import { reduceRow, type RowState } from "../src/index";

const settled: RowState = { kind: "settled", units: 800 };

describe("reduceRow", () => {
  it("paints the proposal on the row without touching the settled value", () => {
    const next = reduceRow(settled, { type: "agent-proposed", units: 1240 });
    expect(next).toEqual({
      kind: "proposed",
      units: 800,
      proposedUnits: 1240,
    });
  });

  it("walks accept through committing and commits the proposed value", () => {
    const proposed = reduceRow(settled, {
      type: "agent-proposed",
      units: 1240,
    });
    const committing = reduceRow(proposed, { type: "person-accepted" });
    expect(committing.kind).toBe("committing");
    const committed = reduceRow(committing, { type: "commit-succeeded" });
    expect(committed).toEqual({
      kind: "committed",
      units: 1240,
      previousUnits: 800,
    });
  });

  it("undo is a new write through the same gate, not a rewind", () => {
    const committed: RowState = reduceRow(
      reduceRow(settled, { type: "agent-proposed", units: 1240 }),
      { type: "person-accepted" },
    );
    const committed2 = reduceRow(committed, { type: "commit-succeeded" });

    // The undo ends in committing at the old value. It does not
    // rewind to a settled row in which neither write ever happened.
    const undoing = reduceRow(committed2, { type: "person-undid" });
    expect(undoing).toEqual({
      kind: "committing",
      units: 1240,
      proposedUnits: 800,
    });
    const undone = reduceRow(undoing, { type: "commit-succeeded" });
    expect(undone).toEqual({
      kind: "committed",
      units: 800,
      previousUnits: 1240,
    });
  });

  it("a failed commit falls back to the visible proposal", () => {
    const committing: RowState = {
      kind: "committing",
      units: 800,
      proposedUnits: 1240,
    };
    const next = reduceRow(committing, { type: "commit-failed" });
    expect(next).toEqual({
      kind: "proposed",
      units: 800,
      proposedUnits: 1240,
    });
  });

  it("rejects the proposal back to settled", () => {
    const proposed = reduceRow(settled, {
      type: "agent-proposed",
      units: 1240,
    });
    expect(reduceRow(proposed, { type: "person-rejected" })).toEqual({
      kind: "settled",
      units: 800,
    });
  });

  it("ignores events a state cannot take", () => {
    // A second proposal while one is pending changes nothing.
    const proposed = reduceRow(settled, {
      type: "agent-proposed",
      units: 1240,
    });
    expect(reduceRow(proposed, { type: "agent-proposed", units: 999 })).toBe(
      proposed,
    );
    // Undo without a commit changes nothing.
    expect(reduceRow(proposed, { type: "person-undid" })).toBe(proposed);
  });
});
