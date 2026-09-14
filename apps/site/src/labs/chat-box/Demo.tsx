import { Button } from "@labs/ui/components/Button";
import { Checkbox } from "@labs/ui/components/Checkbox";
import { Panel } from "@labs/ui/components/Panel";
import { Select } from "@labs/ui/components/Select";
import { Stack } from "@labs/ui/components/Stack";
import { Tabs } from "@labs/ui/components/Tabs";
import { Textarea } from "@labs/ui/components/Textarea";
import { useEffect, useRef, useState } from "react";
import { A2UIRenderer } from "./A2UIRenderer";
import {
  actionFrom,
  receiveA2UI,
  writePath,
  type A2UIMessage,
  type Surface,
} from "./a2ui";
import {
  initialAgentView,
  proposalEvents,
  receiveEvent,
  responseEvents,
  resultText,
  runInput,
  type DemoEvent,
} from "./events";
import { components, surfaceMessages, surfaceResult } from "./surfaces";
import { createTicketService, type Decision } from "./ticket";
import { useStrings } from "./strings";
type Mode = "agui" | "a2ui";
type Entry = { direction: string; name: string; payload: unknown };
function pause(ms: number, signal: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) return resolve(false);
    const done = (value: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", aborted);
      resolve(value);
    };
    const aborted = () => done(false);
    const timer = setTimeout(() => done(true), ms);
    signal.addEventListener("abort", aborted, { once: true });
  });
}
function ProtocolDemo({ mode }: { mode: Mode }) {
  const s = useStrings();
  const service = useRef(createTicketService());
  const [ticket, setTicket] = useState(() => createTicketService().read());
  const [view, setView] = useState(initialAgentView);
  const [surface, setSurface] = useState<Surface | null>(null);
  const surfaceRef = useRef<Surface | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [phase, setPhase] = useState<
    "idle" | "receiving" | "review" | "saving" | "done"
  >("idle");
  const [choose, setChoose] = useState(false);
  const [refuse, setRefuse] = useState(false);
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState("");
  const [editorNotice, setEditorNotice] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const busy = phase === "receiving" || phase === "saving";
  const log = (direction: string, name: string, payload: unknown) =>
    setEntries((previous) => [
      ...previous,
      { direction, name, payload: structuredClone(payload) },
    ]);
  function emit(event: DemoEvent) {
    log(s.server, event.type, event);
    setView((previous) => receiveEvent(previous, event));
  }
  function deliver(message: unknown) {
    const next = receiveA2UI(surfaceRef.current, message);
    surfaceRef.current = next;
    setSurface(next);
    const parsed = message as A2UIMessage;
    log(
      s.a2uiServer,
      Object.keys(parsed).find((key) => key !== "version")!,
      parsed,
    );
  }
  function reset() {
    abort.current?.abort();
    service.current = createTicketService();
    setTicket(service.current.read());
    setView(initialAgentView());
    setSurface(null);
    surfaceRef.current = null;
    setEntries([]);
    setPhase("idle");
    setNotice("");
    setEditorNotice("");
    setRefuse(false);
    setEditor("");
  }
  async function run() {
    const controller = new AbortController();
    abort.current = controller;
    setPhase("receiving");
    setNotice("");
    if (mode === "agui") {
      log(s.client, s.runRequest, runInput(s));
      for (const event of proposalEvents(s)) {
        if (!(await pause(110, controller.signal))) return;
        emit(event);
      }
    } else {
      log(s.client, s.inputRequest, {
        request: choose ? s.chooseRequest : s.request,
        ticketId: ticket.ticketId,
      });
      for (const message of surfaceMessages(s, choose)) {
        if (!(await pause(200, controller.signal))) return;
        deliver(message);
      }
      setEditor(
        JSON.stringify(
          {
            version: "v0.9.1",
            updateComponents: {
              surfaceId: "ticket-assignment",
              components: components(s, choose),
            },
          },
          null,
          2,
        ),
      );
    }
    setPhase("review");
  }
  async function decide(name: string, context: Record<string, unknown>) {
    if (phase !== "review") return;
    const controller = new AbortController();
    abort.current = controller;
    setPhase("saving");
    setNotice("");
    if (!(await pause(500, controller.signal))) return;
    const decision: Decision =
      name === "discard_assignment"
        ? { kind: "discarded" }
        : name === "save_assignment"
          ? service.current.save(context["ticketId"], context["teamId"], refuse)
          : { kind: "refused" };
    setRefuse(false);
    log(s.service, decision.kind, decision);
    if (decision.kind === "saved") setTicket(decision.ticket);
    if (mode === "agui") {
      log(s.client, s.runRequest, runInput(s, view.state, decision));
      for (const event of responseEvents(s, decision, view.state)) {
        if (!(await pause(90, controller.signal))) return;
        emit(event);
      }
      setPhase("done");
    } else {
      for (const message of surfaceResult(s, decision)) deliver(message);
      setPhase(decision.kind === "refused" ? "review" : "done");
    }
    setNotice(resultText(s, decision));
  }
  function userAction(componentId: string) {
    if (!surfaceRef.current || phase !== "review") return;
    const message = actionFrom(surfaceRef.current, componentId);
    log(s.a2uiClient, s.action, message);
    void decide(message.action.name, message.action.context);
  }
  return (
    <Stack gap="lg">
      <p>{mode === "agui" ? s.fixedIntro : s.a2uiIntro}</p>
      {mode === "a2ui" && (
        <Select
          label={s.requestLabel}
          value={choose ? "choose" : "direct"}
          disabled={phase !== "idle"}
          onChange={(event) =>
            setChoose(event.currentTarget.value === "choose")
          }
          options={[
            { value: "direct", label: s.direct },
            { value: "choose", label: s.choose },
          ]}
        />
      )}
      <blockquote>
        {choose && mode === "a2ui" ? s.chooseRequest : s.request}
      </blockquote>
      <Stack direction="inline" gap="sm" wrap>
        <Button onClick={() => void run()} disabled={phase !== "idle"}>
          {phase === "receiving" ? s.preparing : s.run}
        </Button>
        <Button variant="outline" onClick={reset}>
          {s.reset}
        </Button>
      </Stack>
      <div className="demo-panes">
        <Panel label={s.conversation}>
          <Stack gap="md">
            {mode === "agui" ? (
              <>
                <p>{view.step || view.reply || s.start}</p>
                {view.call?.complete &&
                  view.state.proposedTeamId &&
                  phase !== "done" && (
                    <Panel label={s.reviewCard}>
                      <Stack gap="md">
                        <p>
                          {s.current}: {s.teams[view.state.currentTeamId]}
                          <br />
                          {s.proposed}:{" "}
                          <strong>{s.teams[view.state.proposedTeamId]}</strong>
                        </p>
                        <Stack direction="inline" gap="sm" wrap>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void decide("save_assignment", {
                                ticketId: JSON.parse(view.call!.args).ticketId,
                                teamId: view.state.proposedTeamId,
                              })
                            }
                          >
                            {s.save}
                          </Button>
                          <Button
                            disabled={busy}
                            variant="outline"
                            onClick={() =>
                              void decide("discard_assignment", {})
                            }
                          >
                            {s.discard}
                          </Button>
                        </Stack>
                      </Stack>
                    </Panel>
                  )}
              </>
            ) : surface ? (
              <A2UIRenderer
                surface={surface}
                busy={busy || phase === "done"}
                onAction={userAction}
                onEdit={(path, value) => {
                  if (!surfaceRef.current || phase !== "review") return;
                  const next = {
                    ...surfaceRef.current,
                    data: writePath(surfaceRef.current.data, path, value),
                  };
                  surfaceRef.current = next;
                  setSurface(next);
                  log(s.localEdit, path, { path, value });
                }}
              />
            ) : (
              <p>{s.noSurface}</p>
            )}
            {(phase === "saving" || notice) && (
              <p role="status">{phase === "saving" ? s.saving : notice}</p>
            )}
          </Stack>
        </Panel>
        <Panel label={s.ticket}>
          <Stack gap="md">
            <strong>{s.ticketTitle}</strong>
            <p>
              {s.savedTeam}:{" "}
              <strong data-testid="saved-team">{s.teams[ticket.teamId]}</strong>
            </p>
          </Stack>
        </Panel>
      </div>
      <Checkbox
        label={s.failNext}
        checked={refuse}
        onCheckedChange={setRefuse}
        disabled={busy || phase === "done"}
      />
      {mode === "a2ui" && (
        <details>
          <summary>{s.editor}</summary>
          <Stack gap="md">
            <p>{s.editorHelp}</p>
            <Textarea
              label={s.messageLabel}
              value={editor}
              rows={12}
              onChange={(event) => setEditor(event.currentTarget.value)}
              disabled={phase !== "review"}
            />
            <Button
              disabled={phase !== "review"}
              onClick={() => {
                try {
                  deliver(JSON.parse(editor));
                  setEditorNotice(s.applied);
                } catch {
                  setEditorNotice(s.invalid);
                }
              }}
            >
              {s.apply}
            </Button>
            {editorNotice && <p role="status">{editorNotice}</p>}
            <a href="/catalogs/ticket-ui.json" target="_blank" rel="noreferrer">
              {s.catalog}
            </a>
          </Stack>
        </details>
      )}
      <details>
        <summary>{s.inspect}</summary>
        <p>{s.inspectIntro}</p>
        <ol>
          {entries.map((entry, index) => (
            <li key={index}>
              <details>
                <summary>
                  {entry.direction} · {entry.name}
                </summary>
                <pre className="demo-call">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ol>
        {surface && (
          <details>
            <summary>{s.dataModel}</summary>
            <pre className="demo-call">
              {JSON.stringify(surface.data, null, 2)}
            </pre>
          </details>
        )}
      </details>
      <p className="demo-note">{s.local}</p>
    </Stack>
  );
}
export default function ChatDemo() {
  const s = useStrings();
  return (
    <Tabs
      label={s.modes}
      tabs={[
        {
          id: "agui",
          label: s.fixed,
          content: <ProtocolDemo key="agui" mode="agui" />,
        },
        {
          id: "a2ui",
          label: s.a2ui,
          content: <ProtocolDemo key="a2ui" mode="a2ui" />,
        },
      ]}
    />
  );
}
