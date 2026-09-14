import { createContext, useContext } from "react";
import type { Team } from "./ticket";
export const english = {
  title: "Follow the messages into the interface",
  intro:
    "Start with AG-UI and a fixed review card. Then try A2UI: its JSON describes the controls, their data bindings, and the action sent when you click Save.",
  modes: "Protocol example",
  fixed: "AG-UI · fixed card",
  a2ui: "A2UI · component description",
  fixedIntro:
    "The client sends a request with the open ticket as context. The scripted agent streams progress, an explanation and proposal state, then calls a frontend review tool. Your decision returns in a second run request.",
  a2uiIntro:
    "A scripted server sends A2UI v0.9.1 messages. A small renderer maps six catalog components to our design system. This tab shows the A2UI exchange directly; it does not wrap it in AG-UI events.",
  request: "Move this ticket to Billing. Show me the change before saving.",
  chooseRequest:
    "Help me route this ticket. Let me choose the team before saving.",
  run: "Send request",
  preparing: "Receiving messages…",
  reset: "Reset example",
  requestLabel: "Request",
  direct: "Propose Billing",
  choose: "Let me choose the team",
  conversation: "Assistant",
  ticket: "Ticket details",
  ticketTitle: "T-104 · Charged twice for my subscription",
  savedTeam: "Saved team",
  current: "Current team",
  proposed: "Proposed team",
  reviewCard: "Review assignment",
  teamLabel: "Assign to",
  chooseTeam: "Choose a team",
  save: "Save assignment",
  discard: "Discard",
  saving: "Saving…",
  pending: "Review the assignment before saving.",
  explanation:
    "This ticket is about a duplicate charge. I propose assigning it to Billing for review.",
  chooseExplanation:
    "Choose the team that should review this ticket, then save the assignment.",
  start: "Send the request to see the response and review controls.",
  saved: (team: string) => `Saved: this ticket is assigned to ${team}.`,
  discarded: "The proposal was discarded. The saved team is unchanged.",
  refused: "The service refused the assignment. The saved team is unchanged.",
  failNext: "Have the service refuse this save",
  reading: "Reading ticket T-104",
  toolDescription:
    "Show the ticket assignment for review and return the user's decision and the service outcome.",
  contextDescription: "The support ticket currently open in the application",
  inspect: "Inspect the exchange",
  inspectIntro:
    "Each entry shows an actual message consumed or produced by this simulation. Open an entry to inspect its JSON.",
  client: "Client → agent",
  server: "Agent → client",
  a2uiServer: "Server → renderer",
  a2uiClient: "Renderer → server",
  localEdit: "Local data binding",
  service: "Ticket service result",
  runRequest: "Run request",
  inputRequest: "Application request",
  action: "User action",
  dataModel: "Surface data model",
  editor: "Change the A2UI message",
  editorHelp:
    "Edit this updateComponents message and apply it to the active surface. Try changing a Text label or the order of children in a Column. The renderer uses your JSON directly.",
  messageLabel: "A2UI message JSON",
  apply: "Apply message",
  applied: "Message applied to the surface.",
  invalid:
    "The message could not be applied. Use valid JSON and the supported catalog shapes; the existing surface has been kept.",
  catalog: "View the six-component catalog",
  noSurface: "Send a request to create the surface.",
  local:
    "The backend responses are scripted; the message processing, component rendering, data bindings and buttons run in this page. The ticket service is in memory. Resetting, switching tabs or reloading clears the example.",
  teams: {
    "general-support": "General Support",
    billing: "Billing",
    "technical-support": "Technical Support",
  } satisfies Record<Team, string>,
};
export type Strings = typeof english;
export const ChatLabStrings = createContext(english);
export const useStrings = () => useContext(ChatLabStrings);
