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
  const desk = useRef(createDesk(START_ROWS));
  const [rows, setRows] = useState<DeskRow[]>([...START_ROWS]);
  const syncFromDesk = () => setRows(desk.current.rows());
  const [registration, setRegistration] = useState<Registration>("checking");
  const [lastCall, setLastCall] = useState<string | null>(null);

  const propose = (sku: string, units: number): string => {
    const answer = desk.current.propose(sku, units);
    syncFromDesk();
    return answer;
  };

  const resolve = (sku: string, accept: boolean) => {
    desk.current.resolve(sku, accept);
    syncFromDesk();
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
      void document.modelContext.registerTool(
        reorderPointToolDescriptor(desk.current),
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
        { tool: "set_reorder_point", input: SAMPLE_CALL },
        null,
        2,
      ),
    );
    propose(SAMPLE_CALL.sku, SAMPLE_CALL.units);
  };

  const reset = () => {
    desk.current = createDesk(START_ROWS);
    syncFromDesk();
    setLastCall(null);
  };

  return (
    <Panel label="Live · a page-registered tool">
      <ul className="demo-status">
        <li>
          <code>set_reorder_point</code> ·{" "}
          {registration === "registered" ? (
            <StatusPill tone="ok">registered on this page</StatusPill>
          ) : registration === "absent" ? (
            <StatusPill tone="off">
              document.modelContext not exposed here
            </StatusPill>
          ) : (
            <span className="state-off">checking…</span>
          )}
        </li>
      </ul>

      <table className="demo-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Article</th>
            <th>Reorder point</th>
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
                    <strong>{row.proposed} units</strong>
                    <span className="demo-inline-actions">
                      <button
                        type="button"
                        className="demo-mini yes"
                        onClick={() => resolve(row.sku, true)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="demo-mini no"
                        onClick={() => resolve(row.sku, false)}
                      >
                        Undo
                      </button>
                    </span>
                  </>
                ) : (
                  `${row.units} units`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="uix-actions">
        <Button onClick={simulate}>Simulate an agent call</Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>

      {lastCall ? (
        <pre className="demo-call">
          <code>{lastCall}</code>
        </pre>
      ) : null}

      <p className="demo-note">
        {registration === "registered"
          ? "The tool is genuinely registered: open the Model Context Tool Inspector extension and you will find set_reorder_point on this page, callable by hand. The simulated call and a real agent call run the identical function."
          : "With the WebMCP origin trial or the chrome://flags/#enable-webmcp-testing flag active, this page registers the tool for real. The simulated call runs the identical function an agent would: no clicking, no guessing, and the person still owns the yes."}
      </p>
    </Panel>
  );
};

export default WebMcpDemo;
