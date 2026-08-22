import { WebMcpDemo } from "@labs/ui";

const WebMcpPage = () => {
  return (
    <div className="page">
      <p className="eyebrow">Lab · Declare Your Product's Verbs</p>
      <h1>A page-registered tool</h1>
      <p className="page-lede">
        From{" "}
        <a href="https://www.markusnissl.com/blog/webmcp-the-page-as-a-tool-surface">
          the article
        </a>
        : an ordering desk that declares set_reorder_point as a callable
        function instead of leaving an agent to guess at buttons.
      </p>

      <section className="lab-section">
        <WebMcpDemo />
        <p>
          Source for this lab:{" "}
          <a
            href="https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/WebMcpDemo.tsx"
            target="_blank"
            rel="noopener noreferrer"
          >
            packages/ui/src/WebMcpDemo.tsx
          </a>{" "}
          in the{" "}
          <a
            href="https://github.com/markusnisslconsulting/labs"
            target="_blank"
            rel="noopener noreferrer"
          >
            labs repository
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default WebMcpPage;
