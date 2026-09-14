import type { Proposal } from "./ticket";

/** The subset consumed by this example. A real backend can send the same event shapes. */
export type DemoEvent =
  | { type: "RUN_STARTED"; threadId: string; runId: string }
  | { type: "RUN_FINISHED"; threadId: string; runId: string }
  | { type: "TEXT_MESSAGE_START"; messageId: string; role: "assistant" }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TEXT_MESSAGE_END"; messageId: string }
  | {
      type: "STATE_SNAPSHOT";
      snapshot: { proposals: Record<string, Proposal> };
    }
  | {
      type: "STATE_DELTA";
      delta: Array<{ op: "add"; path: "/proposals/T-104"; value: Proposal }>;
    };

export function proposalEvents(
  proposal: Proposal,
  explanation: string,
): DemoEvent[] {
  const runId = `run-${proposal.proposalId}`;
  const messageId = `message-${proposal.proposalId}`;
  return [
    { type: "RUN_STARTED", threadId: "ticket-T-104", runId },
    { type: "STATE_SNAPSHOT", snapshot: { proposals: {} } },
    { type: "TEXT_MESSAGE_START", messageId, role: "assistant" },
    { type: "TEXT_MESSAGE_CONTENT", messageId, delta: explanation },
    { type: "TEXT_MESSAGE_END", messageId },
    {
      type: "STATE_DELTA",
      delta: [{ op: "add", path: "/proposals/T-104", value: proposal }],
    },
    { type: "RUN_FINISHED", threadId: "ticket-T-104", runId },
  ];
}
export type View = { explanation: string; proposal: Proposal | null };
export function receiveEvent(view: View, event: DemoEvent): View {
  if (event.type === "TEXT_MESSAGE_START") return { ...view, explanation: "" };
  if (event.type === "TEXT_MESSAGE_CONTENT")
    return { ...view, explanation: view.explanation + event.delta };
  if (event.type === "STATE_SNAPSHOT")
    return { ...view, proposal: event.snapshot.proposals["T-104"] ?? null };
  if (event.type === "STATE_DELTA")
    return { ...view, proposal: event.delta[0]?.value ?? null };
  return view;
}
