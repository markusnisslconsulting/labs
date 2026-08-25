import Demo from "./Demo";

/**
 * The lab's live demo, split into its own chunk.
 * Loaded by lab.tsx's demo() only when this lab is opened.
 */
const OnDeviceLabDemo = () => (
  <section className="lab-demo">
    <h2>Availability is a fact about your machine</h2>
    <Demo />
  </section>
);

export default OnDeviceLabDemo;
