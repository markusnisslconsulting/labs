import Demo from "./Demo";
import UndoMachineDemo from "./UndoMachineDemo";

/**
 * The lab's live demo, split into its own chunk.
 * Loaded by lab.tsx's demo() only when this lab is opened.
 */
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

export default ChatBoxLabDemo;
