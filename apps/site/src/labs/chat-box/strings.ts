import { createContext, useContext } from "react";
import type { Team } from "./ticket";
const english = {
  title: "Review and save a ticket assignment",
  intro:
    "Ask for the Billing assignment, inspect the proposal, then save from either view. Open the additional controls when you are ready to try a refusal or a colleague's edit.",
  request: "Move this ticket to Billing. Show me the change before saving.",
  run: "Request Billing assignment",
  preparing: "Preparing proposal…",
  reset: "Reset example",
  conversation: "Conversation",
  ticket: "Ticket details",
  ticketTitle: "T-104 · Charged twice for my subscription",
  savedTeam: "Saved team",
  current: "Current team",
  proposed: "Proposed team",
  reviewCard: "Proposed assignment",
  save: "Save assignment",
  discard: "Discard",
  saving: "Saving…",
  pending: "The assignment has not been saved.",
  explanation:
    "This ticket is about a duplicate charge. I propose assigning it to Billing for review.",
  start: "Request a proposal to see it here.",
  saved: (team: string) => `Saved: this ticket is assigned to ${team}.`,
  discarded: "Proposal discarded. The saved assignment is unchanged.",
  refused:
    "The service refused this save before writing. The proposal is still available to retry.",
  conflict:
    "A colleague changed the assignment. Review the latest team before saving again.",
  review: "Review latest assignment",
  restore: "Review previous assignment",
  additional: "Try a refusal, a colleague's edit, or a reversal",
  additionalIntro:
    "These controls act on the same ticket service. A colleague's change is hidden from your saved view until the next service response, as it could be in a second browser session.",
  colleague: "Colleague assigns Technical Support",
  failNext: "Refuse next save",
  actual: "Service's current record",
  history: "Saved changes in this tab",
  noHistory: "No changes have been saved.",
  eventHeading: "Inspect the agent events and proposal",
  eventNote:
    "A local script emits these AG-UI events, and the frontend consumes their text and proposal data. No model or network connection is involved. Save and Discard are application actions; the save result comes from the simulated ticket service.",
  local:
    "The service and record live only in this tab. A short delay makes the save request visible. There is no authentication or persistent database; reset or reload clears the example.",
  actor: { user: "User", colleague: "Colleague" },
  teams: {
    "general-support": "General Support",
    billing: "Billing",
    "technical-support": "Technical Support",
  } satisfies Record<Team, string>,
  version: (version: number) => `Version ${version}`,
};
export const ChatLabStrings = createContext(english);
export const useStrings = () => useContext(ChatLabStrings);
