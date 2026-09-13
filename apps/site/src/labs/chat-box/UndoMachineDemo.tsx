import { Stack } from "@labs/ui/components/Stack";
import { Table } from "@labs/ui/components/Table";
import { Button } from "@labs/ui/components/Button";
import { Checkbox } from "@labs/ui/components/Checkbox";
import { Panel } from "@labs/ui/components/Panel";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  createReorderStore,
  reduceRow,
  type RowEvent,
  type Receipt,
  type RowState,
} from "@labs/undo-machine";
import { useStrings } from "./strings";

type DemoEvent = RowEvent | { type: "reset" };
const initial: RowState = {
  kind: "settled",
  current: { units: 800, version: 1 },
};
function reducer(state: RowState, event: DemoEvent): RowState {
  return event.type === "reset" ? initial : reduceRow(state, event);
}

export default function UndoMachineDemo() {
  const s = useStrings();
  const [row, dispatch] = useReducer(reducer, initial);
  const store = useRef(createReorderStore());
  const [stored, setStored] = useState(initial.current);
  const [history, setHistory] = useState<Receipt[]>([]);
  const [failNext, setFailNext] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const syncStore = () => {
    setStored(store.current.read());
    setHistory(store.current.history());
  };
  const accept = () => {
    if (row.kind !== "proposed") return;
    const proposal = row.proposal;
    const refuse = failNext;
    setFailNext(false);
    dispatch({ type: "person-accepted" });
    timer.current = setTimeout(() => {
      const result = refuse
        ? { kind: "refused" as const, reason: "unavailable" as const }
        : store.current.write(proposal);
      dispatch({ type: "write-returned", result });
      syncStore();
      timer.current = null;
    }, 700);
  };
  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    store.current = createReorderStore();
    setFailNext(false);
    syncStore();
    dispatch({ type: "reset" });
  };
  const colleagueEdit = () => {
    const current = store.current.read();
    store.current.write(
      {
        units: current.units + 100,
        expectedVersion: current.version,
        action: "change",
      },
      "colleague",
    );
    syncStore();
  };
  const proposed = "proposal" in row ? row.proposal.units : null;

  return (
    <Panel label={s.lifecyclePanel}>
      <Stack direction="inline" gap="md" align="center" wrap>
        <Button
          onClick={() => dispatch({ type: "agent-proposed", units: 1240 })}
          disabled={row.kind !== "settled"}
        >
          {s.propose}
        </Button>
        <Button variant="outline" onClick={colleagueEdit}>
          {s.colleague}
        </Button>
        <Button variant="outline" onClick={reset}>
          {s.reset}
        </Button>
        <Checkbox
          label={s.failNext}
          checked={failNext}
          onCheckedChange={setFailNext}
          disabled={row.kind === "saving"}
        />
      </Stack>
      <Table caption={s.buyerView}>
        <thead>
          <tr>
            <th scope="col">{s.product}</th>
            <th scope="col">{s.storedValue}</th>
            <th scope="col">{s.proposal}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>4711</td>
            <td>{s.value(row.current.units, row.current.version)}</td>
            <td>
              {proposed === null ? s.none : proposed.toLocaleString("en-US")}
            </td>
          </tr>
        </tbody>
      </Table>
      <p role="status">
        {s.status[row.kind]}
        {row.kind === "proposed" && row.error ? ` · ${s.unavailable}` : ""}
      </p>
      {row.kind === "conflict" ? <p>{s.conflict}</p> : null}
      <Stack direction="inline" gap="md" align="center" wrap>
        {row.kind === "proposed" ? (
          <Button onClick={accept}>{s.save}</Button>
        ) : null}
        {row.kind === "conflict" ? (
          <Button
            onClick={() => dispatch({ type: "person-reviewed-conflict" })}
          >
            {s.review}
          </Button>
        ) : null}
        {row.kind === "proposed" || row.kind === "conflict" ? (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "person-rejected" })}
          >
            {s.reject}
          </Button>
        ) : null}
        {row.kind === "saved" ? (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "person-undid" })}
          >
            {s.restore}
          </Button>
        ) : null}
      </Stack>
      <h3>{s.storeTitle}</h3>
      <p data-testid="stored-record">{s.value(stored.units, stored.version)}</p>
      <Table caption={s.storeCaption}>
        <thead>
          <tr>
            <th scope="col">{s.id}</th>
            <th scope="col">{s.actor}</th>
            <th scope="col">{s.change}</th>
            <th scope="col">{s.version}</th>
          </tr>
        </thead>
        <tbody>
          {history.map((write) => (
            <tr key={write.id}>
              <td>{write.id}</td>
              <td>{write.actor === "buyer" ? s.buyer : s.colleagueActor}</td>
              <td>{s.transition(write.before.units, write.after.units)}</td>
              <td>{write.after.version}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {history.length === 0 ? <p>{s.historyEmpty}</p> : null}
      <p className="demo-note">{s.simulation}</p>
    </Panel>
  );
}
