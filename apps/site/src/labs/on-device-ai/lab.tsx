import type { LabMeta } from "../types";
import { OnDeviceDemo } from "@labs/ui";

const OnDeviceLabDemo = () => (
  <section className="lab-demo">
    <h2>Availability is a fact about your machine</h2>
    <OnDeviceDemo />
  </section>
);

export default {
  slug: "on-device-ai",
  title: "On-device AI in Chrome",
  summary:
    "All seven built-in APIs checked live: detection, translation and summarising on the machine, and the honest unavailable state everywhere else. Nothing downloads without your click.",
  explanation: [
    "Availability is a fact about this browser, this origin and this machine, so the honest first screen is the check itself. In a current desktop Chrome the buttons run entirely on the device; everywhere else you are looking at exactly the states the article says to design for.",
    "The capability arrives by download, leaves when disk runs low, and changes version on the browser's schedule. The demo shows every one of those states instead of hiding them behind a feature flag.",
  ],
  tags: ["web-ai", "chrome"],
  article: {
    title: "On-Device AI in Chrome: What You Can Ship Today",
    href: "https://www.markusnissl.com/blog/chrome-built-in-ai-apis",
  },
  source:
    "https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/OnDeviceDemo.tsx",
  demo: OnDeviceLabDemo,
  storybookPath: "?path=/docs/demos-built-in-apis--docs",
} satisfies LabMeta;
