import { Link } from "react-router";
import { Badge } from "@labs/ui/components/Badge";
import { Card } from "@labs/ui/components/Card";
import { Chip } from "@labs/ui/components/Chip";
import { Cluster } from "@labs/ui/components/Cluster";
import { Stack } from "@labs/ui/components/Stack";
import type { CatalogEntry } from "../catalog/schema";
import { localize } from "../catalog/localize";
import { entryExecutions } from "../catalog/filters";
import { useSiteStrings } from "../i18n/SiteStrings";

export function LabCard({
  entry,
  returnTo,
}: {
  entry: CatalogEntry;
  returnTo: string;
}) {
  const { strings, locale } = useSiteStrings();
  const href = `/${entry.slug}`;
  const article = entry.resources.find(
    (resource) => resource.kind === "article",
  );
  const state = { catalogReturn: returnTo };
  return (
    <Card className="lab-card">
      <Card.Header>
        <Stack gap="md">
          <Cluster gap="xs">
            {entryExecutions(entry).map((mode) => (
              <Badge key={mode}>{strings.execution[mode]}</Badge>
            ))}
          </Cluster>
          <h2 className="lab-card-title">
            <Link id={`catalog-${entry.slug}`} to={href} state={state}>
              {localize(entry.title, locale)}
            </Link>
          </h2>
        </Stack>
      </Card.Header>
      <Card.Body className="lab-card-body">
        <Stack gap="lg">
          <p className="lab-card-summary">{localize(entry.summary, locale)}</p>
          <Cluster
            gap="xs"
            renderAs={<ul />}
            className="plain-list"
            aria-label={strings.tags}
          >
            {entry.tags.map((tag) => (
              <li key={tag}>
                <Chip>{tag}</Chip>
              </li>
            ))}
          </Cluster>
        </Stack>
      </Card.Body>
      <Card.Footer>
        <Cluster gap="md">
          <Link id={`catalog-open-${entry.slug}`} to={href} state={state}>
            {strings.openLab}
          </Link>
          {article ? (
            <a href={article.href} target="_blank" rel="noopener noreferrer">
              {strings.readArticle}
            </a>
          ) : null}
        </Cluster>
      </Card.Footer>
    </Card>
  );
}
