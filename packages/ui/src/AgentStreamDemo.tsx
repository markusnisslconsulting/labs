import { useEffect, useRef, useState } from "react";
import {
  createScriptedRun,
  type AgentEvent,
  type ScriptedRun,
} from "@labs/agent-stream";
import { Button } from "./components/Button";
import { Panel } from "./components/Panel";

type RunState = "idle" | "running" | "awaiting" | "finished";

const START_UNITS = 800;
const PROPOSED_UNITS = 1240;

const eventChip: Record<AgentEvent["type"], string> = {
  "run-started": "RunStarted",
  "text-message": "TextMessageContent",
  "tool-call-started": "ToolCallStart",
  "state-delta": "StateDelta",
  "run-finished": "RunFinished",
};

const AgentStreamDemo = () => {
  const [runState, setRunState] = useState<RunState>("idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [units, setUnits] = useState(START_UNITS);
  const [proposed, setProposed] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const runRef = useRef<ScriptedRun | null>(null);

  const stopRun = () => {
    runRef.current?.cancel();
    runRef.current = null;
  };

  useEffect(() => stopRun, []);

  const onEvent = (event: AgentEvent) => {
    setEvents((e) => [...e, eventChip[event.type]]);
    switch (event.type) {
      case "text-message":
        setTranscript((t) => [...t, event.text]);
        break;
      case "tool-call-started":
        setWorking(true);
        break;
      case "state-delta":
        setWorking(false);
        setProposed(event.proposedUnits);
        setTranscript((t) => [
          ...t,
          `I have proposed raising SKU 4711 from ${START_UNITS} to ${event.proposedUnits} units.`,
        ]);
        setRunState("awaiting");
        break;
    }
  };

  const run = () => {
    stopRun();
    setRunState("running");
    setTranscript([]);
    setEvents([]);
    setUnits(START_UNITS);
    setProposed(null);
    setOutcome(null);

    runRef.current = createScriptedRun({
      fromUnits: START_UNITS,
      toUnits: PROPOSED_UNITS,
      callbacks: { onEvent },
    });
    runRef.current.start();
  };

  const resolve = (accept: boolean) => {
    stopRun();
    setEvents((e) => [...e, eventChip["run-finished"]]);
    if (accept && proposed !== null) {
      setUnits(proposed);
      setOutcome(
        "Same information on both sides. Only one side let you act on it.",
      );
    } else {
      setOutcome(
        "Rejected in one click, on the object. Try finding that move in the transcript.",
      );
    }
    setProposed(null);
    setRunState("finished");
  };

  const reset = () => {
    stopRun();
    setRunState("idle");
    setTranscript([]);
    setEvents([]);
    setUnits(START_UNITS);
    setProposed(null);
    setWorking(false);
    setOutcome(null);
  };

  return (
    <Panel label="Live · transcript versus control surface">
      <div className="uix-actions">
        <Button
          onClick={run}
          disabled={runState === "running" || runState === "awaiting"}
        >
          {runState === "idle" ? "Run the agent" : "Run it again"}
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>

      <div className="demo-panes">
        <div className="demo-pane">
          <h4>The transcript: a log</h4>
          {transcript.length === 0 ? (
            <p className="demo-chat-line">
              <em>Nothing yet. Start the run.</em>
            </p>
          ) : (
            transcript.map((line) => (
              <p key={line} className="demo-chat-line">
                {line}
              </p>
            ))
          )}
        </div>
        <div className="demo-pane">
          <h4>The product: the ordering desk</h4>
          <table className="demo-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Reorder point</th>
              </tr>
            </thead>
            <tbody>
              <tr className={proposed !== null ? "proposed" : ""}>
                <td>4711</td>
                <td>
                  {working ? (
                    <em>agent working…</em>
                  ) : proposed !== null ? (
                    <>
                      <span className="demo-old">{units}</span>
                      <strong>{proposed} units</strong>
                      <span className="demo-inline-actions">
                        <Button
                          variant="confirm-mini"
                          onClick={() => resolve(true)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger-mini"
                          onClick={() => resolve(false)}
                        >
                          Undo
                        </Button>
                      </span>
                    </>
                  ) : (
                    `${units} units`
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="demo-events" aria-label="Events on the wire">
          {events.map((event, index) => (
            <span key={`${event}-${index}`} className="demo-event">
              {event}
            </span>
          ))}
        </div>
      ) : null}

      {outcome ? <p className="demo-note">{outcome}</p> : null}
      {runState === "idle" && !outcome ? (
        <p className="demo-note">
          A scripted run of the same agent, shown twice: as a transcript, and as
          events landing on the product. The event chips are the AG-UI
          vocabulary from this section.
        </p>
      ) : null}
    </Panel>
  );
};

export default AgentStreamDemo;
