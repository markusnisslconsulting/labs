import type { LabMeta } from "../types";
export default {
  slug: "chat-box",
  title: "When an AI Assistant Changes a Record",
  summary:
    "Move a support ticket to Billing. Review one proposal in a conversation and beside the ticket, then follow the save to its result.",
  explanation: [
    "Ticket T-104 belongs to General Support. The request is to move it to Billing, with a review before saving. The conversation card and ticket details show one shared proposal and use the same save operation.",
    "A fixed script supplies the agent events, and a local service simulates the save response. Start with the ordinary save or discard, then open the additional controls to introduce a refusal or another person's edit.",
  ],
  tags: ["agents", "interfaces"],
  article: {
    title: "When an AI Assistant Changes a Record",
    href: "https://www.markusnissl.com/blog/the-chat-box-is-a-log",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/apps/site/src/labs/chat-box",
  demo: () => import("./LabDemo"),
} satisfies LabMeta;
