import type { LabMeta } from "../types";
import Demo from "./Demo";
import UndoMachineDemo from "./UndoMachineDemo";

const ChatBoxLabDemo = () => (
  <>
    <section className="lab-demo">
      <h2>One agent, two surfaces</h2>
      <p>
        The run proposes raising SKU 4711 from 800 to 1,240 units. On the left
        it happens in a transcript, on the right on the row itself. The event
        chips are the AG-UI vocabulary from the article.
      </p>
      <Demo />
    </section>
    <section className="lab-demo">
      <h2>Undo is a state machine, not a button</h2>
      <p>
        Propose, accept, undo. The undo walks back through committing as a new
        write with the old value, and the failure checkbox shows the backend
        refusing while the row keeps telling the truth.
      </p>
      <UndoMachineDemo />
    </section>
  </>
);

export default {
  slug: "chat-box",
  title: "The chat box is a log",
  summary:
    "The same scripted agent run twice: once as a transcript nobody can act on, once as events landing on the row. Plus the undo state machine that keeps the record honest.",
  explanation: [
    "A transcript can only describe what an agent changed. When software acts, the write itself has to appear where the person already looks — on the row it touches, marked as proposed, reversible while it still counts.",
    "Both demos run the exact code the article prints. The event stream comes from @labs/agent-stream, the write lifecycle from @labs/undo-machine; each package carries its own tests, so what you read there is pinned.",
  ],
  tags: ["agents", "agentic-ui"],
  article: {
    title: "The Chat Box Is a Log",
    href: "https://www.markusnissl.com/blog/the-chat-box-is-a-log",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/apps/site/src/labs/chat-box/Demo.tsx",
  demo: ChatBoxLabDemo,
} satisfies LabMeta;
