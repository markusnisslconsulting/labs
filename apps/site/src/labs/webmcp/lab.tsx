import type { LabMeta } from "../types";
export default {
  slug: "webmcp",
  title: "WebMCP: When a Page Declares Its Actions",
  summary:
    "Set a reorder point through a form, then call the same operation through WebMCP. Inspect the arguments, the visible change, and the returned result.",
  explanation: [
    "Product 4711 starts with a reorder point of 800 units. Save 1,240 through the form first. Then use the Model Context Tool Inspector to call set_reorder_point with 900 and follow the result back to the page.",
    "Switch from JavaScript registration to an annotated HTML form to compare the two APIs. Remove a registration, try invalid input, and check which operations still work. Reset or reload restores the sample value.",
    "The form and direct function call work in any browser. Actual WebMCP calls need a supporting Chrome configuration, such as the testing flag described in the article. No model or API key is needed for manual calls in the Inspector.",
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
