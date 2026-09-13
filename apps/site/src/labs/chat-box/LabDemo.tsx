import Demo from "./Demo";
import UndoMachineDemo from "./UndoMachineDemo";
import { useStrings } from "./strings";

export default function ChatBoxLabDemo() {
  const s = useStrings();
  return (
    <>
      <section className="lab-demo">
        <h2>{s.streamTitle}</h2>
        <p>{s.streamIntro}</p>
        <Demo />
      </section>
      <section className="lab-demo">
        <h2>{s.lifecycleTitle}</h2>
        <p>{s.lifecycleIntro}</p>
        <UndoMachineDemo />
      </section>
    </>
  );
}
