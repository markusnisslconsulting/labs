import { Chip } from "@labs/ui/components/Chip";

export interface LabCardProps {
  title: string;
  href: string;
  summary: string;
  tags?: string[];
  /** Optional external companion, typically the article. */
  articleHref?: string;
  articleTitle?: string;
}

/**
 * Overview card for one lab. The whole card routes to the lab; the
 * article link is external and therefore separate, so no nested
 * interactive elements end up inside one anchor.
 */
export function LabCard({
  title,
  href,
  summary,
  tags,
  articleHref,
  articleTitle = "Read the article",
}: LabCardProps) {
  return (
    <article className="uix-labcard">
      <h2>
        <a href={href}>{title}</a>
      </h2>
      <p>{summary}</p>
      {tags?.length ? (
        <ul className="uix-labcard-tags" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag}>
              <Chip>{tag}</Chip>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="uix-labcard-links">
        <a href={href}>Open the lab</a>
        {articleHref ? (
          <>
            <span aria-hidden> · </span>
            <a href={articleHref} target="_blank" rel="noopener noreferrer">
              {articleTitle}
            </a>
          </>
        ) : null}
      </p>
    </article>
  );
}
