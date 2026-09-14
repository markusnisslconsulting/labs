import { createContext, useContext } from "react";
const english = {
  heading: "Change the same value through a form or a tool",
  panel: "Inventory settings",
  product: "Product 4711: Filter coffee 500 g",
  current: "Current reorder point",
  sku: "SKU",
  threshold: "Reorder point, in units",
  save: "Save",
  reset: "Reset example",
  mode: "How the page declares its tool",
  modes: [
    { value: "javascript", label: "JavaScript registration" },
    { value: "form", label: "HTML form: fill, then wait for Save" },
    { value: "autosubmit", label: "HTML form: fill and submit" },
  ],
  registered: "set_reorder_point is registered.",
  absent: "WebMCP is unavailable. The form still works.",
  checking: "Checking registration…",
  removed: "Tool removed. The form still works.",
  failed: (reason: string) => `Registration failed: ${reason}`,
  remove: "Remove tool",
  restore: "Register tool again",
  callHeading: "Try the function with explicit arguments",
  callIntro:
    "Enter the arguments an agent would supply. This button calls the application function directly; use Chrome's Model Context Tool Inspector to invoke the registered browser tool.",
  arguments: "Tool arguments (JSON)",
  direct: "Call setReorderPoint directly",
  invalid: "Enter a JSON object with sku and units.",
  inputTitle: "Input received",
  resultTitle: "Result returned",
  source: {
    form: "Form submission",
    tool: "WebMCP invocation",
    direct: "Direct function call",
  },
  inspector:
    'In the Inspector, choose set_reorder_point and send {"sku":"4711","units":900}. The value above and the returned JSON should agree. Try an unknown SKU or negative units next; the current value should stay unchanged.',
  formNote:
    "In this mode the browser derives the tool from the labeled form fields. A call fills them and waits for Save; the submit handler then changes the value and returns the result.",
  autoNote:
    "In this mode the browser fills and submits the form as part of the call. The same submit handler changes the value and returns the result.",
  javascriptNote:
    "The browser invokes a registered callback, which calls setReorderPoint. Save calls that same function. Remove the tool to check that Save keeps working.",
  localNote:
    "The value is stored only in this page's memory. Reset or reload restores 800. These controls do not run a language model or save to an inventory service.",
  units: (value: number) => `${value.toLocaleString("en-US")} units`,
};
export const WebMcpLabStrings = createContext(english);
export const useStrings = () => useContext(WebMcpLabStrings);
