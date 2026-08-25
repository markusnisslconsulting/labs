import Demo from "./Demo";

/**
 * The lab's live demo, split into its own chunk.
 * Loaded by lab.tsx's demo() only when this lab is opened.
 */
const WebMcpLabDemo = () => (
  <section className="lab-demo">
    <h2>The declared verb, running</h2>
    <Demo />
  </section>
);

export default WebMcpLabDemo;
