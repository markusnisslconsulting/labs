import type { LabMeta } from "../types";
export default {
  slug: "webmcp",
  title: "WebMCP: When a Page Declares Its Actions",
  summary:
    "An inventory page exposes propose_reorder_point to WebMCP callers. Request a proposal, then accept or discard it on the row.",
  explanation: [
    "Product 4711 starts with a reorder point of 800 units. A tool call can propose a different value using its SKU and the new threshold. The page validates the input and displays the proposal for review.",
    "The manual button and registered browser tool use the same desk state. This version adds a review step to the article's basic setter example. It keeps all changes in the tab and clears them on reset or reload.",
    "To invoke the registered tool, use a Chrome configuration that exposes document.modelContext and open the Model Context Tool Inspector. The manual call also works when WebMCP is unavailable.",
  ],
  tags: ["agents", "web-apis"],
  article: {
    title: "WebMCP: When a Page Declares Its Actions",
    href: "https://www.markusnissl.com/blog/webmcp-the-page-as-a-tool-surface",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/apps/site/src/labs/webmcp/Demo.tsx",
  demo: () => import("./LabDemo"),
} satisfies LabMeta;
