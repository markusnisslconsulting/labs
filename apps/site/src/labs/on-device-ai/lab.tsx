import type { LabMeta } from "../types";

export default {
  slug: "on-device-ai",
  title: "On-device AI in Chrome",
  summary:
    "Translate a support message, detect its language, summarize a conversation, and extract an order number using Chrome's local AI APIs.",
  explanation: [
    "Start with the German message and translate it to English. Then detect its language as a separate operation. The summary and extraction exercises have their own editable inputs, matching the article.",
    "Each exercise shows availability for its configuration. Chrome may prepare model files after your click. If an API is unavailable, its example remains visible so you can inspect the input and requirements.",
  ],
  tags: ["web-ai", "chrome"],
  article: {
    title: "On-Device AI in Chrome: What You Can Ship Today",
    href: "https://www.markusnissl.com/blog/chrome-built-in-ai-apis",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/apps/site/src/labs/on-device-ai/Demo.tsx",
  demo: () => import("./LabDemo"),
} satisfies LabMeta;
