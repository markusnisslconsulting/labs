import { Chip } from "@labs/ui/components/Chip";
import { StatusPill } from "@labs/ui/components/StatusPill";

export interface LabCardProps {
  title: string;
  href: string;
  summary: string;
  tags?: string[];
  /** Optional external companion, typically the article. */
  articleHref?: string;
  articleTitle?: string;
  /** Whether the lab has something running, or only stories to read. */
  kind: "demo" | "workbench";
}

/**
 * Overview card for one lab.
 *
 * A column, not a block: the summary takes the slack and the footer is
 * pinned, so cards in a row end at the same line whatever the length of
 * the text. Ragged card bottoms in a grid are the usual symptom of
 * letting content decide height in a layout that already decided it.
 *
 * The title link is the only large target; the article link is external
 * and separate, so no interactive element nests inside another.
 */
export function LabCard({
  title,
  href,
  summary,
  tags,
  articleHref,
  articleTitle = "Read the article",
  kind,
}: LabCardProps) {
  return (
    <article className="lab-card">
      <div className="lab-card-top">
        <StatusPill tone={kind === "demo" ? "ok" : "off"}>
          {kind === "demo" ? "Runs in the browser" : "Storybook"}
        </StatusPill>
      </div>

      <h2 className="lab-card-title">
        <a href={href}>{title}</a>
      </h2>
      <p className="lab-card-summary">{summary}</p>

      {tags?.length ? (
        <ul className="lab-card-tags" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag}>
              <Chip>{tag}</Chip>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="lab-card-links">
        <a href={href}>Open the lab</a>
        {articleHref ? (
          <a href={articleHref} target="_blank" rel="noopener noreferrer">
            {articleTitle}
          </a>
        ) : null}
      </p>
    </article>
  );
}
