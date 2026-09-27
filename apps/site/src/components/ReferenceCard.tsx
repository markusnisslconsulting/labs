import { Badge } from "@labs/ui/components/Badge";
import { Card } from "@labs/ui/components/Card";
import { Stack } from "@labs/ui/components/Stack";
import type { WorkbenchReference } from "../catalog/workbench";
import { storybookHref } from "../catalog/workbench";
import { useSiteStrings } from "../i18n/SiteStrings";

export function ReferenceCard({ entry }: { entry: WorkbenchReference }) {
  const { strings } = useSiteStrings();
  return (
    <Card className="lab-card">
      <Card.Header>
        <Stack gap="md" align="start">
          <Badge>
            {entry.status
              ? strings.componentStatus[entry.status]
              : strings.referenceKind[entry.kind]}
          </Badge>
          <h2 className="lab-card-title">
            <a href={storybookHref(entry)}>{entry.name}</a>
          </h2>
        </Stack>
      </Card.Header>
      {entry.description ? (
        <Card.Body className="lab-card-body">
          <p className="lab-card-summary">{entry.description}</p>
        </Card.Body>
      ) : null}
      {entry.example ? (
        <Card.Footer>
          <a href={storybookHref({ id: entry.example, view: "story" })}>
            {strings.viewExample}
          </a>
        </Card.Footer>
      ) : null}
    </Card>
  );
}
