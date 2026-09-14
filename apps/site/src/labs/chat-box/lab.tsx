import type { LabMeta } from "../types";
export default {
  slug: "chat-box",
  title: "AG-UI and A2UI: Connecting an Agent to Your Application",
  summary:
    "Follow a ticket request through AG-UI, then render an A2UI interface from JSON using the existing component library.",
  explanation: [
    "AG-UI connects the application and agent through requests, streamed events and returned tool results. A2UI describes the components, data bindings and actions a renderer uses to build the interface.",
    "Both examples use ticket T-104 and an in-memory ticket service. The backend is scripted; the clients process the real message shapes. Start with the fixed card, then change the A2UI JSON and choose a team in the rendered form.",
  ],
  tags: ["agents", "interfaces"],
  article: {
    title: "AG-UI and A2UI: Connecting an Agent to Your Application",
    href: "https://www.markusnissl.com/blog/the-chat-box-is-a-log",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/apps/site/src/labs/chat-box",
  demo: () => import("./LabDemo"),
} satisfies LabMeta;
