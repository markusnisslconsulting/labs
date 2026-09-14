import Demo from "./Demo";
import { useStrings } from "./strings";
export default function OnDeviceLabDemo() {
  const s = useStrings();
  return (
    <section className="lab-demo">
      <h2>{s.title}</h2>
      <p>{s.intro}</p>
      <Demo />
    </section>
  );
}
