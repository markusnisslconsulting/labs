import type { RunAgentInput, Message } from "@ag-ui/core";
import type { Decision, Team } from "./ticket";
import type { Strings } from "./strings";
export type AgentState = {
  ticketId: "T-104";
  currentTeamId: Team;
  proposedTeamId: Team | null;
};
export const initialAgentState = (): AgentState => ({
  ticketId: "T-104",
  currentTeamId: "general-support",
  proposedTeamId: null,
});
export type DemoEvent =
  | { type: "RUN_STARTED" | "RUN_FINISHED"; threadId: string; runId: string }
  | { type: "STEP_STARTED" | "STEP_FINISHED"; stepName: string }
  | { type: "TEXT_MESSAGE_START"; messageId: string; role: "assistant" }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TEXT_MESSAGE_END"; messageId: string }
  | { type: "STATE_SNAPSHOT"; snapshot: AgentState }
  | {
      type: "STATE_DELTA";
      delta: [{ op: "replace"; path: "/proposedTeamId"; value: Team | null }];
    }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string }
  | { type: "TOOL_CALL_END"; toolCallId: string };
export type AgentView = {
  reply: string;
  state: AgentState;
  step: string;
  call: { id: string; name: string; args: string; complete: boolean } | null;
};
export const initialAgentView = (): AgentView => ({
  reply: "",
  state: initialAgentState(),
  step: "",
  call: null,
});
export function receiveEvent(view: AgentView, event: DemoEvent): AgentView {
  switch (event.type) {
    case "TEXT_MESSAGE_START":
      return { ...view, reply: "" };
    case "TEXT_MESSAGE_CONTENT":
      return { ...view, reply: view.reply + event.delta };
    case "STEP_STARTED":
      return { ...view, step: event.stepName };
    case "STEP_FINISHED":
      return { ...view, step: "" };
    case "STATE_SNAPSHOT":
      return { ...view, state: structuredClone(event.snapshot) };
    case "STATE_DELTA":
      return {
        ...view,
        state: { ...view.state, proposedTeamId: event.delta[0].value },
      };
    case "TOOL_CALL_START":
      return {
        ...view,
        call: {
          id: event.toolCallId,
          name: event.toolCallName,
          args: "",
          complete: false,
        },
      };
    case "TOOL_CALL_ARGS":
      return view.call?.id === event.toolCallId
        ? {
            ...view,
            call: { ...view.call, args: view.call.args + event.delta },
          }
        : view;
    case "TOOL_CALL_END":
      return view.call?.id === event.toolCallId
        ? { ...view, call: { ...view.call, complete: true } }
        : view;
    default:
      return view;
  }
}
const userMessage = (s: Strings): Message => ({
  id: "user-1",
  role: "user",
  content: s.request,
});
export function runInput(
  s: Strings,
  state = initialAgentState(),
  decision?: Decision,
): RunAgentInput {
  const messages: Message[] = [userMessage(s)];
  if (decision)
    messages.push(
      {
        id: "assistant-1",
        role: "assistant",
        content: s.explanation,
        toolCalls: [
          {
            id: "review-1",
            type: "function",
            function: {
              name: "review_assignment",
              arguments: '{"ticketId":"T-104"}',
            },
          },
        ],
      },
      {
        id: "decision-1",
        role: "tool",
        toolCallId: "review-1",
        content: JSON.stringify(decision),
      },
    );
  return {
    threadId: "ticket-T-104",
    runId: decision ? "run-2" : "run-1",
    messages,
    state,
    context: [{ description: s.contextDescription, value: "T-104" }],
    tools: [
      {
        name: "review_assignment",
        description: s.toolDescription,
        parameters: {
          type: "object",
          properties: { ticketId: { type: "string" } },
          required: ["ticketId"],
          additionalProperties: false,
        },
      },
    ],
    forwardedProps: {},
  };
}
export function proposalEvents(s: Strings): DemoEvent[] {
  return [
    { type: "RUN_STARTED", threadId: "ticket-T-104", runId: "run-1" },
    { type: "STATE_SNAPSHOT", snapshot: initialAgentState() },
    { type: "STEP_STARTED", stepName: s.reading },
    { type: "STEP_FINISHED", stepName: s.reading },
    { type: "TEXT_MESSAGE_START", messageId: "assistant-1", role: "assistant" },
    {
      type: "TEXT_MESSAGE_CONTENT",
      messageId: "assistant-1",
      delta: s.explanation.slice(0, 47),
    },
    {
      type: "TEXT_MESSAGE_CONTENT",
      messageId: "assistant-1",
      delta: s.explanation.slice(47),
    },
    { type: "TEXT_MESSAGE_END", messageId: "assistant-1" },
    {
      type: "STATE_DELTA",
      delta: [{ op: "replace", path: "/proposedTeamId", value: "billing" }],
    },
    {
      type: "TOOL_CALL_START",
      toolCallId: "review-1",
      toolCallName: "review_assignment",
    },
    { type: "TOOL_CALL_ARGS", toolCallId: "review-1", delta: '{"ticketId":' },
    { type: "TOOL_CALL_ARGS", toolCallId: "review-1", delta: '"T-104"}' },
    { type: "TOOL_CALL_END", toolCallId: "review-1" },
    { type: "RUN_FINISHED", threadId: "ticket-T-104", runId: "run-1" },
  ];
}
export function resultText(s: Strings, decision: Decision): string {
  return decision.kind === "saved"
    ? s.saved(s.teams[decision.ticket.teamId])
    : decision.kind === "discarded"
      ? s.discarded
      : s.refused;
}
export function responseEvents(
  s: Strings,
  decision: Decision,
  state: AgentState,
): DemoEvent[] {
  return [
    { type: "RUN_STARTED", threadId: "ticket-T-104", runId: "run-2" },
    {
      type: "STATE_SNAPSHOT",
      snapshot: {
        ...state,
        currentTeamId:
          decision.kind === "saved"
            ? decision.ticket.teamId
            : state.currentTeamId,
        proposedTeamId: null,
      },
    },
    { type: "TEXT_MESSAGE_START", messageId: "assistant-2", role: "assistant" },
    {
      type: "TEXT_MESSAGE_CONTENT",
      messageId: "assistant-2",
      delta: resultText(s, decision),
    },
    { type: "TEXT_MESSAGE_END", messageId: "assistant-2" },
    { type: "RUN_FINISHED", threadId: "ticket-T-104", runId: "run-2" },
  ];
}
