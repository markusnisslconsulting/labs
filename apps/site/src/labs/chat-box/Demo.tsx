import { Stack } from "@labs/ui/components/Stack";
import { Button } from "@labs/ui/components/Button";
import { Panel } from "@labs/ui/components/Panel";
import { Table } from "@labs/ui/components/Table";
import { useEffect, useRef, useState } from "react";
import {
  createScriptedRun,
  type AgentEvent,
  type ScriptedRun,
} from "@labs/agent-stream";
import { useStrings } from "./strings";

export default function AgentStreamDemo() {
  const s = useStrings();
  const [running, setRunning] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [units, setUnits] = useState(800);
  const [proposed, setProposed] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<boolean | null>(null);
  const runRef = useRef<ScriptedRun | null>(null);
  useEffect(() => () => runRef.current?.cancel(), []);
  const reset = () => {
    runRef.current?.cancel();
    setRunning(false);
    setTranscript([]);
    setEvents([]);
    setUnits(800);
    setProposed(null);
    setOutcome(null);
  };
  const onEvent = (event: AgentEvent) => {
    setEvents((all) => [...all, event.type]);
    if (event.type === "text-message")
      setTranscript((all) => [...all, event.text]);
    if (event.type === "state-delta") {
      setProposed(event.proposedUnits);
      setRunning(false);
    }
  };
  const run = () => {
    reset();
    setRunning(true);
    runRef.current = createScriptedRun({
      fromUnits: 800,
      narration: s.narration,
      toUnits: 1240,
      callbacks: { onEvent },
    });
    runRef.current.start();
  };
  const resolve = (accepted: boolean) => {
    if (proposed === null) return;
    runRef.current?.cancel();
    if (accepted) setUnits(proposed);
    setOutcome(accepted);
    setProposed(null);
    setEvents((all) => [
      ...all,
      accepted ? "proposal-accepted" : "proposal-discarded",
    ]);
  };
  const controls = () => (
    <Stack direction="inline" gap="md" align="center" wrap>
      <Button size="sm" onClick={() => resolve(true)}>
        {s.accept}
      </Button>
      <Button size="sm" variant="outline" onClick={() => resolve(false)}>
        {s.discard}
      </Button>
    </Stack>
  );
  return (
    <Panel label={s.streamPanel}>
      <Stack direction="inline" gap="md" align="center" wrap>
        <Button onClick={run} disabled={running || proposed !== null}>
          {s.run}
        </Button>
        <Button variant="outline" onClick={reset}>
          {s.reset}
        </Button>
      </Stack>
      <div className="demo-panes">
        <Panel>
          <h3>{s.conversation}</h3>
          <p>{s.request}</p>
          {transcript.length === 0 ? (
            <p>{running ? s.working : s.start}</p>
          ) : (
            transcript.map((line) => <p key={line}>{line}</p>)
          )}
          {proposed !== null ? (
            <>
              <p>{s.reviewSummary(units, proposed)}</p>
              {controls()}
            </>
          ) : null}
          {outcome !== null ? (
            <p>{outcome ? s.accepted : s.discarded}</p>
          ) : null}
        </Panel>
        <Panel>
          <h3>{s.desk}</h3>
          <Table caption={s.desk}>
            <thead>
              <tr>
                <th scope="col">{s.product}</th>
                <th scope="col">{s.storedValue}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>4711</td>
                <td>{units.toLocaleString("en-US")}</td>
              </tr>
            </tbody>
          </Table>
          {proposed !== null ? (
            <>
              <p>{s.reviewSummary(units, proposed)}</p>
              {controls()}
            </>
          ) : null}
        </Panel>
      </div>
      <p role="status">
        {running
          ? s.working
          : proposed !== null
            ? s.reviewSummary(units, proposed)
            : ""}
      </p>
      <div className="demo-events" role="group" aria-label={s.events}>
        {events.map((event, index) => (
          <span className="demo-event" key={`${event}-${index}`}>
            {event}
          </span>
        ))}
      </div>
      <p className="demo-note">{s.streamNote}</p>
    </Panel>
  );
}
