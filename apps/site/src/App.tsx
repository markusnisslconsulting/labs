import { Suspense, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router";
import { Chip } from "@labs/ui/components/Chip";
import { Panel } from "@labs/ui/components/Panel";
import { SearchInput } from "@labs/ui/components/SearchInput";
import { LabCard } from "./components/LabCard";
import { allTags, labBySlug, labDemos, labs } from "./labs";

const Home = () => {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const visible = labs.filter((lab) => {
    if (tag && !lab.tags.includes(tag)) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [lab.title, lab.summary, ...lab.tags]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Markus Nissl · Labs</p>
        <h1>The code behind the writing, running.</h1>
        <p className="page-lede">
          Every lab here is the code an article prints, compiled and executable.
          Open one to run it; the article next to it explains why it is built
          that way.
        </p>
      </header>

      <div className="lab-controls" role="search">
        <SearchInput
          placeholder="Search the labs"
          label="Search the labs"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <div className="chip-row" role="group" aria-label="Filter by tag">
          <Chip
            interactive
            active={tag === null}
            onActiveChange={() => setTag(null)}
          >
            All
          </Chip>
          {allTags.map((entry) => (
            <Chip
              key={entry}
              interactive
              active={tag === entry}
              onActiveChange={() => setTag(tag === entry ? null : entry)}
            >
              {entry}
            </Chip>
          ))}
        </div>
      </div>

      <p className="count-line" role="status">
        {visible.length} of {labs.length} {labs.length === 1 ? "lab" : "labs"}
        {tag ? `, tagged “${tag}”` : ""}
      </p>

      {visible.length > 0 ? (
        <ul className="lab-list">
          {visible.map((lab) => (
            <li key={lab.slug}>
              <LabCard
                title={lab.title}
                href={`/${lab.slug}`}
                summary={lab.summary}
                tags={lab.tags}
                articleHref={lab.article.href}
                kind={lab.demo ? "demo" : "workbench"}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Panel label="Nothing matched">
          <p>
            No lab matches “{query || tag}”.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setQuery("");
                setTag(null);
              }}
            >
              Clear the filters
            </button>{" "}
            to see all {labs.length}.
          </p>
        </Panel>
      )}
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

const LabPage = () => {
  const { slug } = useParams();
  const lab = labBySlug(slug);

  if (!lab) {
    return <NotFound />;
  }

  const Demo = labDemos[lab.slug];

  return (
    <article className="page">
      <p className="eyebrow">
        <Link to="/" className="crumb">
          Labs
        </Link>{" "}
        · {lab.article.title}
      </p>
      <h1>{lab.title}</h1>

      {lab.explanation.map((paragraph) => (
        <p className="page-lede" key={paragraph.slice(0, 40)}>
          {paragraph}
        </p>
      ))}

      <ul className="link-row" aria-label="Links for this lab">
        <li>
          <a href={lab.article.href} target="_blank" rel="noopener noreferrer">
            Read the article ↗
          </a>
        </li>
        <li>
          <a href={lab.source} target="_blank" rel="noopener noreferrer">
            Source on GitHub ↗
          </a>
        </li>
        {lab.storybookPath ? (
          <li>
            <a href={`/storybook/index.html${lab.storybookPath}`}>
              Open in Storybook ↗
            </a>
          </li>
        ) : null}
      </ul>

      {Demo ? (
        <Suspense
          fallback={<p className="lab-demo-loading">Loading the demo…</p>}
        >
          <Demo />
        </Suspense>
      ) : null}

      {!Demo && lab.storybookPath ? (
        <>
          <Panel label="The workbench, embedded">
            <iframe
              title={`${lab.title} in Storybook`}
              src={`/storybook/index.html${lab.storybookPath}`}
              loading="lazy"
              className="story-frame"
            />
          </Panel>
          <p>
            The frame above is the hosted Storybook;{" "}
            <a href={`/storybook/index.html${lab.storybookPath}`}>
              open it full-size
            </a>{" "}
            to drive states yourself.
          </p>
        </>
      ) : null}
    </article>
  );
};

const App = () => {
  return (
    <>
      {/* The constant chrome: the brand plus external destinations.
          Discovering a lab happens in the overview through search and tags,
          not here, or the header would grow with every lab. */}
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            <img
              src="/logo.webp"
              alt=""
              width={28}
              height={12}
              style={{ height: "0.85rem", width: "auto" }}
            />
            Labs
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <a href="/storybook/" target="_blank" rel="noopener noreferrer">
              Storybook ↗
            </a>
            <a
              href="https://github.com/markusnisslconsulting/labs"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
            <a
              href="https://www.markusnissl.com/blog"
              target="_blank"
              rel="noopener noreferrer"
            >
              Writing ↗
            </a>
          </nav>
        </div>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<LabPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>
          Running companions to{" "}
          <a href="https://www.markusnissl.com/blog">markusnissl.com/blog</a>.
          Every demo here is the code the article prints, checked against the
          packages it names. Source:{" "}
          <a href="https://github.com/markusnisslconsulting/labs">
            markusnisslconsulting/labs
          </a>
          .
        </p>
      </footer>
    </>
  );
};

export default App;
