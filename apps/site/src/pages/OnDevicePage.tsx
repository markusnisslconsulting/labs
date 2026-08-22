import { OnDeviceDemo } from "@labs/ui";

const OnDevicePage = () => {
  return (
    <div className="page">
      <p className="eyebrow">Lab · On-Device AI in Chrome</p>
      <h1>Seven APIs, checked live</h1>
      <p className="page-lede">
        From{" "}
        <a href="https://www.markusnissl.com/blog/chrome-built-in-ai-apis">
          the article
        </a>
        : availability is a fact about this browser and this machine, so the
        honest first screen is the check itself. In Chrome you get translation,
        summarising and extraction on the device; everywhere else you see the
        state the article says to design for.
      </p>

      <section className="lab-section">
        <OnDeviceDemo />
      </section>
    </div>
  );
};

export default OnDevicePage;
