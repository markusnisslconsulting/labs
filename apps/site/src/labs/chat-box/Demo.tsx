import { Button } from "@labs/ui/components/Button";
import { Checkbox } from "@labs/ui/components/Checkbox";
import { Panel } from "@labs/ui/components/Panel";
import { Stack } from "@labs/ui/components/Stack";
import { useEffect, useRef, useState } from "react";
import { createTicketService, type Receipt } from "./ticket";
import {
  proposalEvents,
  receiveEvent,
  type DemoEvent,
  type View,
} from "./events";
import { useStrings } from "./strings";

export default function ChatDemo() {
  const s = useStrings();
  const [service, setService] = useState(createTicketService);
  const [acknowledged, setAcknowledged] = useState(service.read);
  const [actual, setActual] = useState(service.read);
  const [view, setView] = useState<View>({ explanation: "", proposal: null });
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "review" | "saving" | "conflict" | "saved"
  >("idle");
  const [notice, setNotice] = useState("");
  const [failNext, setFailNext] = useState(false);
  const [history, setHistory] = useState<Receipt[]>([]);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const busy = phase === "preparing" || phase === "saving";

  function propose() {
    setPhase("preparing");
    setNotice("");
    setEvents([]);
    timer.current = setTimeout(() => {
      const incoming = proposalEvents(
        service.propose({ ticketId: "T-104", teamId: "billing" }),
        s.explanation,
      );
      setAcknowledged(service.read());
      setActual(service.read());
      setEvents(incoming);
      setView(
        incoming.reduce(receiveEvent, { explanation: "", proposal: null }),
      );
      setPhase("review");
    }, 300);
  }
  function save() {
    if (!view.proposal || phase !== "review") return;
    const id = view.proposal.proposalId;
    setPhase("saving");
    setNotice("");
    timer.current = setTimeout(() => {
      const result = service.save(id);
      setFailNext(false);
      setActual(service.read());
      if (result.kind === "saved") {
        setAcknowledged(result.receipt.after);
        setLastReceipt(result.receipt);
        setView((previous) => ({ ...previous, proposal: null }));
        setNotice(s.saved(s.teams[result.receipt.after.teamId]));
        setHistory(service.history());
        setPhase("saved");
      } else if (result.kind === "conflict") {
        setAcknowledged(result.current);
        setNotice(s.conflict);
        setPhase("conflict");
      } else {
        setNotice(s.refused);
        setPhase("review");
      }
    }, 700);
  }
  function discard() {
    if (view.proposal) service.discard(view.proposal.proposalId);
    setView((previous) => ({ ...previous, proposal: null }));
    setNotice(s.discarded);
    setPhase("idle");
  }
  function reviewLatest() {
    if (!view.proposal) return;
    service.discard(view.proposal.proposalId);
    const replacement = service.propose({
      ticketId: "T-104",
      teamId: view.proposal.proposedTeamId,
    });
    setAcknowledged(service.read());
    setView((previous) => ({ ...previous, proposal: replacement }));
    setNotice("");
    setPhase("review");
  }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    const next = createTicketService();
    setService(next);
    setAcknowledged(next.read());
    setActual(next.read());
    setView({ explanation: "", proposal: null });
    setEvents([]);
    setPhase("idle");
    setNotice("");
    setFailNext(false);
    setHistory([]);
    setLastReceipt(null);
  }
  const review = view.proposal && (
    <Stack gap="md">
      <strong>{s.reviewCard}</strong>
      <p>
        {s.current}: {s.teams[acknowledged.teamId]}
        <br />
        {s.proposed}: <strong>{s.teams[view.proposal.proposedTeamId]}</strong>
      </p>
      <p>{phase === "conflict" ? s.conflict : s.pending}</p>
      <Stack direction="inline" gap="sm" wrap>
        {phase === "conflict" ? (
          <Button onClick={reviewLatest}>{s.review}</Button>
        ) : (
          <Button onClick={save} disabled={busy}>
            {phase === "saving" ? s.saving : s.save}
          </Button>
        )}
        <Button variant="outline" onClick={discard} disabled={busy}>
          {s.discard}
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <Stack gap="lg">
      <Stack direction="inline" gap="md" wrap>
        <Button onClick={propose} disabled={busy || !!view.proposal}>
          {phase === "preparing" ? s.preparing : s.run}
        </Button>
        <Button variant="outline" onClick={reset}>
          {s.reset}
        </Button>
      </Stack>
      <div className="demo-panes">
        <Panel label={s.conversation}>
          <Stack gap="md">
            <p>{s.request}</p>
            <p>{view.explanation || s.start}</p>
            {review}
            {notice && <p role="status">{notice}</p>}
          </Stack>
        </Panel>
        <Panel label={s.ticket}>
          <Stack gap="md">
            <strong>{s.ticketTitle}</strong>
            <p>
              {s.savedTeam}:{" "}
              <strong data-testid="saved-team">
                {s.teams[acknowledged.teamId]}
              </strong>
            </p>
            {review}
            {notice && <p>{notice}</p>}
          </Stack>
        </Panel>
      </div>
      <details>
        <summary>{s.additional}</summary>
        <Stack gap="md">
          <p>{s.additionalIntro}</p>
          <Checkbox
            label={s.failNext}
            checked={failNext}
            onCheckedChange={(value) => {
              setFailNext(value);
              service.refuseNext(value);
            }}
            disabled={busy}
          />
          <Stack direction="inline" gap="md" wrap>
            <Button
              variant="outline"
              onClick={() => {
                setActual(service.colleague());
                setHistory(service.history());
              }}
            >
              {s.colleague}
            </Button>
            {lastReceipt && (
              <Button
                variant="outline"
                disabled={busy || !!view.proposal}
                onClick={() => {
                  setView((previous) => ({
                    ...previous,
                    proposal: service.restore(lastReceipt),
                  }));
                  setNotice("");
                  setPhase("review");
                }}
              >
                {s.restore}
              </Button>
            )}
          </Stack>
          <p>
            {s.actual}:{" "}
            <strong data-testid="service-team">{s.teams[actual.teamId]}</strong>{" "}
            · {s.version(actual.version)}
          </p>
          <strong>{s.history}</strong>
          {history.length ? (
            <ol>
              {history.map((receipt) => (
                <li key={receipt.after.version}>
                  {s.actor[receipt.actor]}: {s.teams[receipt.before.teamId]} →{" "}
                  {s.teams[receipt.after.teamId]} ·{" "}
                  {s.version(receipt.after.version)}
                </li>
              ))}
            </ol>
          ) : (
            <p>{s.noHistory}</p>
          )}
        </Stack>
      </details>
      <details>
        <summary>{s.eventHeading}</summary>
        <p>{s.eventNote}</p>
        <pre className="demo-call">{JSON.stringify(events, null, 2)}</pre>
      </details>
      <p className="demo-note">{s.local}</p>
    </Stack>
  );
}
