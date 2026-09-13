import { createContext, useContext } from "react";
const english = {
  heading: "Request a proposal through a page tool",
  panel: "A page-registered proposal tool",
  registered: "Registered on this page",
  absent: "WebMCP is unavailable in this browser",
  checking: "Checking browser support…",
  table: "Products and proposed reorder points",
  sku: "SKU",
  product: "Product",
  reorderPoint: "Reorder point",
  accept: "Accept",
  discard: "Discard",
  manualCall: "Call the proposal function",
  reset: "Reset",
  units: (value: number) => `${value.toLocaleString("en-US")} units`,
  registeredNote:
    "Open the Model Context Tool Inspector and invoke propose_reorder_point with a SKU and units. The registered tool and the manual button both call the desk's proposal function.",
  absentNote:
    "The manual button calls the proposal function directly. A browser exposing document.modelContext also registers it as propose_reorder_point for WebMCP callers.",
  localNote:
    "This example stores changes only in the tab. Accept applies the proposal locally; Discard leaves the current value unchanged. Reset or reload restores the sample data.",
};
export const WebMcpLabStrings = createContext(english);
export const useStrings = () => useContext(WebMcpLabStrings);
