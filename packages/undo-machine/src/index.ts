/**
 * The row's write lifecycle as a pure state machine.
 *
 * Companion to the article "The Chat Box Is a Log"
 * (https://www.markusnissl.com/blog/the-chat-box-is-a-log), which
 * prints excerpts of this file; the live demo at
 * https://labs.markusnissl.com/chat-box runs it, so the printed code
 * is the running code.
 *
 * Two transitions carry the design:
 * - commit-failed falls back to the visible proposal instead of lying
 *   about what the database holds;
 * - person-undid is not a rewind. It is a new write with the old
 *   value, and it walks through the same committing gate as the
 *   original write, so the record shows both writes.
 */
export type RowState =
  | { kind: "settled"; units: number }
  | { kind: "proposed"; units: number; proposedUnits: number }
  | { kind: "committing"; units: number; proposedUnits: number }
  | { kind: "committed"; units: number; previousUnits: number };

export type RowEvent =
  | { type: "agent-proposed"; units: number }
  | { type: "person-accepted" }
  | { type: "person-rejected" }
  | { type: "commit-succeeded" }
  | { type: "commit-failed" }
  | { type: "person-undid" };

export function reduceRow(state: RowState, event: RowEvent): RowState {
  switch (event.type) {
    case "agent-proposed":
      return state.kind === "settled"
        ? { kind: "proposed", units: state.units, proposedUnits: event.units }
        : state;
    case "person-accepted":
      return state.kind === "proposed"
        ? {
            kind: "committing",
            units: state.units,
            proposedUnits: state.proposedUnits,
          }
        : state;
    case "person-rejected":
      return state.kind === "proposed"
        ? { kind: "settled", units: state.units }
        : state;
    case "commit-succeeded":
      return state.kind === "committing"
        ? {
            kind: "committed",
            units: state.proposedUnits,
            previousUnits: state.units,
          }
        : state;
    case "commit-failed":
      return state.kind === "committing"
        ? {
            kind: "proposed",
            units: state.units,
            proposedUnits: state.proposedUnits,
          }
        : state;
    case "person-undid":
      return state.kind === "committed"
        ? {
            kind: "committing",
            units: state.units,
            proposedUnits: state.previousUnits,
          }
        : state;
  }
}
