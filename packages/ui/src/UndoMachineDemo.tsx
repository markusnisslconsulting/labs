import { useEffect, useReducer, useRef, useState } from "react";
import { reduceRow, type RowEvent, type RowState } from "@labs/undo-machine";
import { Button } from "./components/Button";
import { Panel } from "./components/Panel";
const START_UNITS = 800;
const PROPOSED_UNITS = 1240;

const eventLabel: Record<RowEvent["type"], string> = {
  "agent-proposed": "agent-proposed (StateDelta paints the row)",
  "person-accepted": "person-accepted (respond() fires)",
  "person-rejected": "person-rejected (respond() fires)",
  "commit-succeeded": "commit-succeeded (your backend answered)",
  "commit-failed": "commit-failed (your backend refused)",
  "person-undid": "person-undid (a new write, same gate)",
};

type DemoState = { row: RowState; log: string[] };
type DemoEvent = RowEvent | { type: "reset" };

const initialDemoState: DemoState = {
  row: { kind: "settled", units: START_UNITS },
  log: [],
};

function demoReducer(state: DemoState, event: DemoEvent): DemoState {
  if (event.type === "reset") {
    return initialDemoState;
  }
  const next = reduceRow(state.row, event);
  if (next === state.row) {
    return state;
  }
  return {
    row: next,
    log: [
      ...state.log,
      `${eventLabel[event.type]}: ${state.row.kind} → ${next.kind}`,
    ],
  };
}

const UndoMachineDemo = () => {
  const [{ row: state, log }, dispatch] = useReducer(
    demoReducer,
    initialDemoState,
  );
  const [failNext, setFailNext] = useState(false);
  const timeouts = useRef<number[]>([]);

  useEffect(
    () => () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const commitLater = (shouldFail: boolean) => {
    timeouts.current.push(
      window.setTimeout(() => {
        dispatch({ type: shouldFail ? "commit-failed" : "commit-succeeded" });
      }, 700),
    );
  };

  const accept = () => {
    const shouldFail = failNext;
    setFailNext(false);
    dispatch({ type: "person-accepted" });
    commitLater(shouldFail);
  };

  const undo = () => {
    dispatch({ type: "person-undid" });
    commitLater(false);
  };

  const reset = () => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
    setFailNext(false);
    dispatch({ type: "reset" });
  };

  return (
    <Panel label="Live · the write lifecycle as a state machine">
      <div className="uix-actions">
        <Button
          onClick={() =>
            dispatch({ type: "agent-proposed", units: PROPOSED_UNITS })
          }
          disabled={state.kind !== "settled"}
        >
          Agent proposes
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
        <label className="demo-chat-line">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(e) => setFailNext(e.target.checked)}
            disabled={state.kind !== "settled" && state.kind !== "proposed"}
          />{" "}
          fail the next commit
        </label>
      </div>

      <table className="demo-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Reorder point</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          <tr className={state.kind === "proposed" ? "proposed" : ""}>
            <td>4711</td>
            <td aria-live="polite">
              {state.kind === "settled" ? `${state.units} units` : null}
              {state.kind === "proposed" ? (
                <>
                  <span className="demo-old">{state.units}</span>
                  <strong>{state.proposedUnits} units</strong>
                  <span className="demo-inline-actions">
                    <Button variant="confirm-mini" onClick={accept}>
                      Accept
                    </Button>
                    <Button
                      variant="danger-mini"
                      onClick={() => dispatch({ type: "person-rejected" })}
                    >
                      Reject
                    </Button>
                  </span>
                </>
              ) : null}
              {state.kind === "committing" ? (
                <em>
                  {state.units} → {state.proposedUnits} units, saving…
                </em>
              ) : null}
              {state.kind === "committed" ? (
                <>
                  <strong>{state.units} units</strong>
                  <span className="demo-inline-actions">
                    <Button variant="danger-mini" onClick={undo}>
                      Undo
                    </Button>
                  </span>
                </>
              ) : null}
            </td>
            <td>
              <span className="demo-event">{state.kind}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {log.length > 0 ? (
        <div className="demo-events" aria-label="Transitions">
          {log.map((line, index) => (
            <span key={`${line}-${index}`} className="demo-event">
              {line}
            </span>
          ))}
        </div>
      ) : (
        <p className="demo-note">
          The machine from the code above, running. Let the agent propose,
          accept, then undo, and watch the undo walk through the same committing
          state as the original write. Tick the failure box to see the commit
          refuse and the row fall back to the proposal.
        </p>
      )}
    </Panel>
  );
};

export default UndoMachineDemo;
