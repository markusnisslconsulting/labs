import type { LabMeta } from "../types";
import { WebMcpDemo } from "@labs/ui";

const WebMcpLabDemo = () => (
  <section className="lab-demo">
    <h2>The declared verb, running</h2>
    <WebMcpDemo />
  </section>
);

export default {
  slug: "webmcp",
  title: "Declare your product's verbs",
  summary:
    "An ordering desk that registers set_reorder_point as a callable function. With the flag on, the registration is real; without it, the simulate button runs the identical code an agent would.",
  explanation: [
    "An agent clicking through a page is guessing. A page that declares its actions as callable functions replaces the guessing with a contract: typed input, a promised result, and the person still owns the yes.",
    "The desk state and the tool descriptor live in @labs/reorder-desk, tested without a browser. The component is a thin view over it — one function with two callers, the button and the agent, which is the whole drift defence.",
    "To see the real registration, open this page in Chrome with the WebMCP origin trial or the chrome://flags/#enable-webmcp-testing flag, then call set_reorder_point from the Model Context Tool Inspector.",
  ],
  tags: ["agents", "web-apis"],
  article: {
    title: "Declare Your Product's Verbs",
    href: "https://www.markusnissl.com/blog/webmcp-the-page-as-a-tool-surface",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/WebMcpDemo.tsx",
  demo: WebMcpLabDemo,
  storybookPath: "?path=/docs/demos-ordering-desk--docs",
} satisfies LabMeta;
