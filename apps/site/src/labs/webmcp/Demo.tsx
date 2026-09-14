import { Stack } from "@labs/ui/components/Stack";
import { Button } from "@labs/ui/components/Button";
import { Panel } from "@labs/ui/components/Panel";
import { TextField } from "@labs/ui/components/TextField";
import { Textarea } from "@labs/ui/components/Textarea";
import { Select } from "@labs/ui/components/Select";
import { useEffect, useRef, useState } from "react";
import { createDesk, reorderPointToolDescriptor } from "@labs/reorder-desk";
import { useStrings } from "./strings";

const START_ROWS = [{ sku: "4711", name: "Filter coffee 500 g", units: 800 }];
type Mode = "javascript" | "form" | "autosubmit";
type Source = "form" | "tool" | "direct";
type AgentSubmitEvent = SubmitEvent & {
  agentInvoked?: boolean;
  respondWith(result: Promise<string>): void;
};

export default function WebMcpDemo() {
  const s = useStrings();
  const [rows, setRows] = useState(START_ROWS);
  const [desk] = useState(() => createDesk(START_ROWS, setRows));
  const [mode, setMode] = useState<Mode>("javascript");
  const [enabled, setEnabled] = useState(true);
  const [registration, setRegistration] = useState(s.checking);
  const [args, setArgs] = useState('{ "sku": "4711", "units": 1240 }');
  const [error, setError] = useState("");
  const [trace, setTrace] = useState<{
    source: Source;
    input: unknown;
    result: string;
  } | null>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const element = form.current!;
    const apply = (input: Record<string, unknown>, source: Source) => {
      const result = desk.setReorderPoint(input);
      setTrace({ source, input, result });
      return result;
    };
    const submit = (event: SubmitEvent) => {
      event.preventDefault();
      const fields = new FormData(element);
      const input = {
        sku: fields.get("sku"),
        units: Number(fields.get("units")),
      };
      const agentEvent = event as AgentSubmitEvent;
      const result = apply(input, agentEvent.agentInvoked ? "tool" : "form");
      if (agentEvent.agentInvoked)
        agentEvent.respondWith(Promise.resolve(result));
    };
    element.addEventListener("submit", submit);
    const controller = new AbortController();
    let active = true;
    async function register() {
      const context = document.modelContext;
      if (!context) {
        setRegistration(s.absent);
        return;
      }
      if (!enabled) {
        setRegistration(s.removed);
        return;
      }
      setRegistration(s.checking);
      try {
        if (mode === "javascript") {
          await context.registerTool(
            {
              ...reorderPointToolDescriptor(desk),
              execute: (input) => apply(input, "tool"),
            },
            { signal: controller.signal },
          );
        } else {
          element.setAttribute("toolname", "set_reorder_point");
          element.setAttribute(
            "tooldescription",
            reorderPointToolDescriptor(desk).description,
          );
          if (mode === "autosubmit") element.setAttribute("toolautosubmit", "");
        }
        if (active) setRegistration(s.registered);
      } catch (caught) {
        if (active) setRegistration(s.failed(String(caught)));
      }
    }
    void register();
    return () => {
      active = false;
      controller.abort();
      element.removeEventListener("submit", submit);
      for (const attribute of ["toolname", "tooldescription", "toolautosubmit"])
        element.removeAttribute(attribute);
    };
  }, [desk, mode, enabled, s]);

  function directCall() {
    try {
      const input: unknown = JSON.parse(args);
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw new Error(s.invalid);
      const result = desk.setReorderPoint(input as Record<string, unknown>);
      setTrace({ source: "direct", input, result });
      setError("");
    } catch {
      setError(s.invalid);
    }
  }

  return (
    <Stack gap="lg">
      <Panel label={s.panel}>
        <Stack gap="md">
          <p>{s.product}</p>
          <p>
            {s.current}:{" "}
            <strong data-testid="reorder-point">
              {s.units(rows[0]!.units)}
            </strong>
          </p>
          <form ref={form}>
            <Stack gap="md">
              <TextField
                label={s.sku}
                name="sku"
                defaultValue="4711"
                required
              />
              <TextField
                label={s.threshold}
                name="units"
                type="number"
                min="0"
                step="1"
                defaultValue="1240"
                required
              />
              <Button type="submit">{s.save}</Button>
            </Stack>
          </form>
          <p className="demo-note">{s.localNote}</p>
        </Stack>
      </Panel>
      <Select
        label={s.mode}
        value={mode}
        options={s.modes}
        onChange={(event) => {
          setMode(event.target.value as Mode);
          setEnabled(true);
        }}
      />
      <p role="status">{registration}</p>
      <p>
        {mode === "javascript"
          ? s.javascriptNote
          : mode === "form"
            ? s.formNote
            : s.autoNote}
      </p>
      <Stack direction="inline" gap="md" wrap>
        <Button variant="outline" onClick={() => setEnabled(!enabled)}>
          {enabled ? s.remove : s.restore}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            desk.reset();
            form.current?.reset();
            setTrace(null);
            setError("");
          }}
        >
          {s.reset}
        </Button>
      </Stack>
      <p>{s.inspector}</p>
      <Panel label={s.callHeading}>
        <Stack gap="md">
          <p>{s.callIntro}</p>
          <Textarea
            label={s.arguments}
            value={args}
            onChange={(event) => setArgs(event.target.value)}
            error={error}
          />
          <Button onClick={directCall}>{s.direct}</Button>
        </Stack>
      </Panel>
      {trace && (
        <Panel label={s.source[trace.source]}>
          <Stack gap="md">
            <strong>{s.inputTitle}</strong>
            <pre className="demo-call">
              {JSON.stringify(trace.input, null, 2)}
            </pre>
            <strong>{s.resultTitle}</strong>
            <pre className="demo-call" data-testid="tool-result">
              {JSON.stringify(JSON.parse(trace.result), null, 2)}
            </pre>
          </Stack>
        </Panel>
      )}
    </Stack>
  );
}
