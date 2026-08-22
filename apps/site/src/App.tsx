import { useState } from "react";
import { Link, Route, Routes, useParams } from "react-router";
import { Chip } from "@labs/ui";
import { allTags, labBySlug, labs } from "./labs";

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
      <section className="hero">
        <p className="eyebrow">Markus Nissl · Labs</p>
        <h1>
          Code that accompanies <span className="hero-accent">the writing</span>
          .
        </h1>
        <p className="page-lede">
          Each lab runs the exact code an article prints. Nothing here is a
          mock-up of the argument; it is the argument, compiled.
        </p>
        <ul className="hero-stats" aria-label="What this workspace guarantees">
          <li>{labs.length} labs</li>
          <li>4 tested packages</li>
          <li>axe-checked components</li>
          <li>every target cached</li>
        </ul>
      </section>

      {labs.length > 3 ? (
        <div className="lab-controls">
          <input
            type="search"
            className="lab-search"
            placeholder="Search the labs"
            aria-label="Search the labs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="chip-row" role="group" aria-label="Filter by tag">
            <Chip
              interactive
              active={tag === null}
              onSelect={() => setTag(null)}
            >
              All
            </Chip>
            {allTags.map((entry) => (
              <Chip
                key={entry}
                interactive
                active={tag === entry}
                onSelect={() => setTag(tag === entry ? null : entry)}
              >
                {entry}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <p className="count-line" role="status">
        {visible.length} of {labs.length} {labs.length === 1 ? "lab" : "labs"}
        {tag ? `, tagged “${tag}”` : ""}
      </p>

      {visible.length > 0 ? (
        <ul className="lab-list">
          {visible.map((lab) => (
            <li key={lab.slug} className="lab-card">
              <h2>
                <Link to={`/${lab.slug}`}>{lab.title}</Link>
              </h2>
              <p>{lab.summary}</p>
              <ul className="card-tags" aria-label="Tags">
                {lab.tags.map((entry) => (
                  <li key={entry}>
                    <Chip>{entry}</Chip>
                  </li>
                ))}
              </ul>
              <p className="lab-links">
                <Link to={`/${lab.slug}`}>Open the lab</Link>
                <span aria-hidden> · </span>
                <a
                  href={lab.article.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the article
                </a>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="page-lede">
          No lab matches. Clear the search or pick another tag.
        </p>
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

  const Demo = lab.demo;

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

      {Demo ? <Demo /> : null}

      {!Demo && lab.storybookPath ? (
        <>
          <section className="lab-demo">
            <h2>The workbench, embedded</h2>
            <iframe
              title={`${lab.title} in Storybook`}
              src={`/storybook/index.html${lab.storybookPath}`}
              loading="lazy"
              className="story-frame"
            />
          </section>
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
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            Labs
          </Link>
          <nav className="site-nav" aria-label="Labs">
            {labs.slice(0, 4).map((lab) => (
              <Link key={lab.slug} to={`/${lab.slug}`}>
                {lab.title.replace("@labs/ui ", "")}
              </Link>
            ))}
            {labs.length > 4 ? <Link to="/">All {labs.length}</Link> : null}
          </nav>
          <a href="https://www.markusnissl.com/blog" className="site-back">
            Writing ↗
          </a>
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
