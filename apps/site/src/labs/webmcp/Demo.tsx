import { Stack } from "@labs/ui/components/Stack";
import { useStrings } from "./strings";
import { Table } from "@labs/ui/components/Table";
import { Button } from "@labs/ui/components/Button";
import { Panel } from "@labs/ui/components/Panel";
import { StatusPill } from "@labs/ui/components/StatusPill";
import { useEffect, useRef, useState } from "react";
import {
  createDesk,
  reorderPointToolDescriptor,
  type DeskRow,
} from "@labs/reorder-desk";

type Registration = "checking" | "registered" | "absent";

const START_ROWS: DeskRow[] = [
  { sku: "4711", name: "Filter coffee 500 g", units: 800, proposed: null },
  { sku: "4712", name: "Espresso beans 1 kg", units: 350, proposed: null },
  { sku: "4713", name: "Oat drink 1 l", units: 1200, proposed: null },
];

const SAMPLE_CALL = { sku: "4711", units: 1240 };

const WebMcpDemo = () => {
  const s = useStrings();
  const [rows, setRows] = useState<DeskRow[]>([...START_ROWS]);
  const desk = useRef(createDesk(START_ROWS, setRows));
  const [registration, setRegistration] = useState<Registration>("checking");
  const [lastCall, setLastCall] = useState<string | null>(null);

  const propose = (sku: string, units: number): string => {
    const answer = desk.current.propose(sku, units);
    return answer;
  };

  const resolve = (sku: string, accept: boolean) => {
    desk.current.resolve(sku, accept);
  };

  useEffect(() => {
    if (typeof document === "undefined" || !document.modelContext) {
      // Checked here rather than in the initial state: probing asks for
      // a browser property that does not exist while prerendering. Set
      // in the initial state, server and browser would diverge and
      // hydration would break. Runs exactly once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegistration("absent");
      return;
    }
    const controller = new AbortController();
    try {
      const descriptor = reorderPointToolDescriptor(desk.current);
      void document.modelContext.registerTool(
        {
          ...descriptor,
          execute(input) {
            setLastCall(
              JSON.stringify({ tool: descriptor.name, input }, null, 2),
            );
            return descriptor.execute(input);
          },
        },
        { signal: controller.signal },
      );
      setRegistration("registered");
    } catch {
      setRegistration("absent");
    }
    return () => controller.abort();
  }, []);

  const simulate = () => {
    setLastCall(
      JSON.stringify(
        { tool: "propose_reorder_point", input: SAMPLE_CALL },
        null,
        2,
      ),
    );
    propose(SAMPLE_CALL.sku, SAMPLE_CALL.units);
  };

  const reset = () => {
    desk.current.reset();
    setLastCall(null);
  };

  return (
    <Panel label={s.panel}>
      <ul className="demo-status">
        <li>
          <code>propose_reorder_point</code> ·{" "}
          {registration === "registered" ? (
            <StatusPill tone="ok">{s.registered}</StatusPill>
          ) : registration === "absent" ? (
            <StatusPill tone="off">{s.absent}</StatusPill>
          ) : (
            <span className="state-off">{s.checking}</span>
          )}
        </li>
      </ul>

      <Table caption={s.table}>
        <thead>
          <tr>
            <th scope="col">{s.sku}</th>
            <th scope="col">{s.product}</th>
            <th scope="col" data-numeric>
              {s.reorderPoint}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.sku}
              className={row.proposed !== null ? "proposed" : ""}
            >
              <td>{row.sku}</td>
              <td>{row.name}</td>
              <td>
                {row.proposed !== null ? (
                  <>
                    <span className="demo-old">{row.units}</span>
                    <strong>{s.units(row.proposed)}</strong>
                    <span className="demo-inline-actions">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolve(row.sku, true)}
                      >
                        {s.accept}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolve(row.sku, false)}
                      >
                        {s.discard}
                      </Button>
                    </span>
                  </>
                ) : (
                  s.units(row.units)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Stack direction="inline" gap="md" align="center" wrap>
        <Button onClick={simulate}>{s.manualCall}</Button>
        <Button variant="outline" onClick={reset}>
          {s.reset}
        </Button>
      </Stack>

      {lastCall ? (
        <pre className="demo-call">
          <code>{lastCall}</code>
        </pre>
      ) : null}

      <p className="demo-note">
        {registration === "registered" ? s.registeredNote : s.absentNote}{" "}
        {s.localNote}
      </p>
    </Panel>
  );
};

export default WebMcpDemo;
