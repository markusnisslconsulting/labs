import { Link, Route, Routes } from "react-router";
import ChatBoxPage from "./pages/ChatBoxPage";
import WebMcpPage from "./pages/WebMcpPage";
import OnDevicePage from "./pages/OnDevicePage";

const articles = {
  "chat-box": {
    title: "The chat box is a log",
    blurb:
      "When software acts, the transcript can only describe. Two demos from the article: the same scripted agent run twice, once as a transcript and once as events landing on the row, and the undo state machine that keeps the record honest.",
    href: "https://www.markusnissl.com/blog/the-chat-box-is-a-log",
    lab: "chat-box",
  },
  webmcp: {
    title: "Declare your product's verbs",
    blurb:
      "A page that registers set_reorder_point as a callable tool. With the WebMCP flag on, the registration is real and the Tool Inspector can call it; without it, the simulate button runs the identical function an agent would.",
    href: "https://www.markusnissl.com/blog/webmcp-the-page-as-a-tool-surface",
    lab: "webmcp",
  },
  "on-device-ai": {
    title: "On-device AI in Chrome",
    blurb:
      "All seven built-in APIs checked live: availability per machine, translation and summarising on the device, and the honest unavailable state everywhere else.",
    href: "https://www.markusnissl.com/blog/chrome-built-in-ai-apis",
    lab: "on-device-ai",
  },
} as const;

const Home = () => {
  return (
    <div className="page">
      <p className="eyebrow">Markus Nissl · Labs</p>
      <h1>Code that accompanies the writing.</h1>
      <p className="page-lede">
        Each lab runs the exact code an article prints. Nothing here is a
        mock-up of the argument; it is the argument, compiled.
      </p>
      <ul className="lab-list">
        {Object.entries(articles).map(([slug, entry]) => (
          <li key={slug} className="lab-card">
            <h2>
              <Link to={`/${entry.lab}`}>{entry.title}</Link>
            </h2>
            <p>{entry.blurb}</p>
            <p className="lab-links">
              <Link to={`/${entry.lab}`}>Open the lab</Link>
              <span aria-hidden> · </span>
              <a href={entry.href} target="_blank" rel="noopener noreferrer">
                Read the article
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const NotFound = () => {
  return (
    <div className="page">
      <h1>This lab does not exist.</h1>
      <p className="page-lede">
        Pick one from the <Link to="/">overview</Link>.
      </p>
    </div>
  );
};

const App = () => {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            Labs
          </Link>
          <nav className="site-nav" aria-label="Labs">
            <Link to="/chat-box">Chat box</Link>
            <Link to="/webmcp">WebMCP</Link>
            <Link to="/on-device-ai">On-device AI</Link>
          </nav>
          <a href="https://www.markusnissl.com/blog" className="site-back">
            Writing ↗
          </a>
        </div>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat-box" element={<ChatBoxPage />} />
          <Route path="/webmcp" element={<WebMcpPage />} />
          <Route path="/on-device-ai" element={<OnDevicePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>
          Running companions to{" "}
          <a href="https://www.markusnissl.com/blog">markusnissl.com/blog</a>.
          Every demo here is the code the article prints, checked against the
          packages it names.
        </p>
      </footer>
    </>
  );
};

export default App;
