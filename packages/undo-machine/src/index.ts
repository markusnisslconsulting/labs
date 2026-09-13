/** In-memory teaching model. No network, database, authentication or durable log. */
export type Snapshot = { units: number; version: number };
export type Write = {
  units: number;
  expectedVersion: number;
  action: "change" | "restore";
};
export type Receipt = {
  id: number;
  before: Snapshot;
  after: Snapshot;
  action: Write["action"];
  actor: "buyer" | "colleague";
};
export type WriteResult =
  | { kind: "saved"; receipt: Receipt }
  | { kind: "conflict"; current: Snapshot }
  | { kind: "refused"; reason: "unavailable" | "invalid-units" };

/** The version check and update happen together in this synchronous store. */
export function createReorderStore(units = 800) {
  let current: Snapshot = { units, version: 1 };
  const history: Receipt[] = [];
  return {
    read: (): Snapshot => ({ ...current }),
    history: (): Receipt[] => structuredClone(history),
    write(request: Write, actor: Receipt["actor"] = "buyer"): WriteResult {
      if (!Number.isSafeInteger(request.units) || request.units < 0) {
        return { kind: "refused", reason: "invalid-units" };
      }
      if (request.expectedVersion !== current.version) {
        return { kind: "conflict", current: { ...current } };
      }
      const receipt: Receipt = {
        id: history.length + 1,
        before: { ...current },
        after: { units: request.units, version: current.version + 1 },
        actor,
        action: request.action,
      };
      current = { ...receipt.after };
      history.push(structuredClone(receipt));
      return { kind: "saved", receipt };
    },
  };
}

export type RowState =
  | { kind: "settled"; current: Snapshot }
  | { kind: "proposed"; current: Snapshot; proposal: Write; error?: string }
  | { kind: "saving"; current: Snapshot; proposal: Write }
  | { kind: "saved"; current: Snapshot; receipt: Receipt }
  | { kind: "conflict"; current: Snapshot; proposal: Write };
export type RowEvent =
  | { type: "agent-proposed"; units: number }
  | { type: "person-accepted" }
  | { type: "person-rejected" }
  | { type: "write-returned"; result: WriteResult }
  | { type: "person-undid" }
  | { type: "person-reviewed-conflict" };

export function reduceRow(state: RowState, event: RowEvent): RowState {
  switch (event.type) {
    case "agent-proposed":
      return state.kind === "settled" &&
        Number.isSafeInteger(event.units) &&
        event.units >= 0
        ? {
            kind: "proposed",
            current: state.current,
            proposal: {
              units: event.units,
              expectedVersion: state.current.version,
              action: "change",
            },
          }
        : state;
    case "person-accepted":
      return state.kind === "proposed"
        ? { kind: "saving", current: state.current, proposal: state.proposal }
        : state;
    case "person-rejected":
      return state.kind === "proposed" || state.kind === "conflict"
        ? { kind: "settled", current: state.current }
        : state;
    case "write-returned": {
      if (state.kind !== "saving") return state;
      const result = event.result;
      if (result.kind === "saved") {
        return {
          kind: "saved",
          current: result.receipt.after,
          receipt: result.receipt,
        };
      }
      if (result.kind === "conflict") {
        return {
          kind: "conflict",
          current: result.current,
          proposal: state.proposal,
        };
      }
      return {
        kind: "proposed",
        current: state.current,
        proposal: state.proposal,
        error: result.reason,
      };
    }
    case "person-undid":
      return state.kind === "saved"
        ? {
            kind: "proposed",
            current: state.current,
            proposal: {
              units: state.receipt.before.units,
              expectedVersion: state.receipt.after.version,
              action: "restore",
            },
          }
        : state;
    case "person-reviewed-conflict":
      return state.kind === "conflict"
        ? {
            kind: "proposed",
            current: state.current,
            proposal: {
              ...state.proposal,
              expectedVersion: state.current.version,
            },
          }
        : state;
  }
}
