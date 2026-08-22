import { AgentStreamDemo, UndoMachineDemo } from "@labs/ui";

const ChatBoxPage = () => {
  return (
    <div className="page">
      <p className="eyebrow">Lab · The Chat Box Is a Log</p>
      <h1>The transcript versus the row</h1>
      <p className="page-lede">
        Two demos from{" "}
        <a href="https://www.markusnissl.com/blog/the-chat-box-is-a-log">
          the article
        </a>
        . The state machine behind the second one is a tested package in this
        repository; the printed excerpts are this running code.
      </p>

      <section className="lab-section">
        <h2>One agent, two surfaces</h2>
        <p>
          The run proposes raising SKU 4711 from 800 to 1,240 units. On the left
          it happens in a transcript, on the right on the row itself. The event
          chips are the AG-UI vocabulary.
        </p>
        <AgentStreamDemo />
      </section>

      <section className="lab-section">
        <h2>Undo is a state machine, not a button</h2>
        <p>
          Propose, accept, undo. The undo walks back through committing as a new
          write with the old value, and the failure checkbox shows the backend
          refusing while the row keeps telling the truth.
        </p>
        <UndoMachineDemo />
      </section>
    </div>
  );
};

export default ChatBoxPage;
