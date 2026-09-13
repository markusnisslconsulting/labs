import type { LabMeta } from "../types";

export default {
  slug: "chat-box",
  title: "When an AI assistant changes a record",
  summary:
    "Follow a scripted proposal into a review card and a product row. Save it, simulate a colleague's edit, and try restoring the previous value.",
  explanation: [
    "A buyer asks an assistant to prepare product 4711 for a promotion. The sample proposes raising its reorder point from 800 to 1,240 units. The conversation and table show the same proposal and offer the same review controls.",
    "A second example separates the buyer's view from an in-memory store. Each saved version has a receipt; a stale save returns a conflict. Everything runs locally with fixed inputs, so the lab demonstrates interface behavior without a model or server.",
  ],
  tags: ["agents", "agentic-ui"],
  article: {
    title: "When an AI Assistant Changes a Record",
    href: "https://www.markusnissl.com/blog/the-chat-box-is-a-log",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/apps/site/src/labs/chat-box",
  demo: () => import("./LabDemo"),
} satisfies LabMeta;
