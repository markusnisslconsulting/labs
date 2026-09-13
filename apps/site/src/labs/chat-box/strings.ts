import { createContext, useContext } from "react";

const english = {
  lifecycleTitle: "Review, save, and restore a reorder point",
  lifecycleIntro:
    "Product 4711 starts at 800 units. Propose 1,240, review it, and save. Then try restoring 800. To test a conflict, let a colleague edit the stored record before your save completes.",
  simulation:
    "This simulation runs entirely in this tab. Timers imitate a delayed response; there is no model, server, authentication, or persistent database. Reset or reload clears the record and history.",
  lifecyclePanel: "The buyer's view and the simulated store",
  propose: "Propose 1,240",
  reset: "Reset",
  failNext: "Refuse the next save before writing",
  colleague: "Colleague saves a different value",
  buyerView: "Buyer's last acknowledged record",
  product: "Product",
  storedValue: "Last acknowledged value",
  proposal: "Proposed value",
  state: "Status",
  review: "Review against latest value",
  save: "Save reviewed value",
  reject: "Discard proposal",
  restore: "Review restore to previous value",
  saving: "Saving…",
  none: "No proposal",
  unavailable:
    "The simulated store refused this save without writing. You can retry.",
  conflict:
    "The stored record changed after this proposal was prepared. Review the latest value before trying again, or discard the proposal.",
  storeTitle: "Simulated store",
  storeCaption: "Successful writes in this tab",
  historyEmpty: "No writes yet. Proposals do not change the store.",
  id: "Write",
  actor: "Actor",
  change: "Change",
  version: "Version",
  buyer: "Buyer",
  colleagueActor: "Colleague",
  status: {
    settled: "No pending change",
    proposed: "Awaiting review",
    saving: "Saving",
    saved: "Saved",
    conflict: "Conflict",
  },
  value: (units: number, version: number) =>
    `${units.toLocaleString("en-US")} units · version ${version}`,
  transition: (before: number, after: number) =>
    `${before.toLocaleString("en-US")} → ${after.toLocaleString("en-US")}`,
  streamTitle: "Follow a proposal from the assistant to the screen",
  streamIntro:
    "A fixed script emits application events. Its text appears in the conversation; its proposal appears in both a review card and the product row. Either set of controls updates the same local state.",
  streamPanel: "One proposal, two places to review it",
  run: "Play scripted proposal",
  conversation: "Conversation with a review card",
  desk: "Ordering desk",
  start: "Start the script to see the proposal arrive.",
  request:
    "Prepare product 4711 for next week's promotion. Show me the change before saving.",
  narration:
    "For this example, I propose a reorder point of 1,240 units for product 4711.",
  working: "Preparing a proposal…",
  reviewSummary: (units: number, proposed: number) =>
    `Product 4711: ${units.toLocaleString("en-US")} → ${proposed.toLocaleString("en-US")} units. The stored value has not changed.`,
  accept: "Accept proposal",
  discard: "Discard proposal",
  accepted:
    "The proposal was accepted in the local simulation. Both views now show the same value. The save-and-conflict example below adds a separate store and response.",
  discarded: "The proposal was discarded. The local value remains 800 units.",
  events: "Application events emitted by the script",
  streamNote:
    "These are application events inspired by AG-UI's event families, not an AG-UI wire connection. No model or backend is involved.",
};

/** Products embedding the lab can supply a translated string set. */
export const ChatLabStrings = createContext(english);
export const useStrings = () => useContext(ChatLabStrings);
