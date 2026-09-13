import Demo from "./Demo";
import { useStrings } from "./strings";
export default function WebMcpLabDemo() {
  const s = useStrings();
  return (
    <section className="lab-demo">
      <h2>{s.heading}</h2>
      <Demo />
    </section>
  );
}
