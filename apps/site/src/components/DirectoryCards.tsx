import { Link } from "react-router";
import { Card } from "@labs/ui/components/Card";
import { Columns } from "@labs/ui/components/Columns";
import { directories } from "../catalog/directories";
import { useSiteStrings } from "../i18n/SiteStrings";

export function DirectoryCards() {
  const { strings } = useSiteStrings();
  return (
    <Columns
      min="lg"
      renderAs={<ul />}
      className="lab-list plain-list"
      aria-label={strings.directoryNavigation}
    >
      {directories.map((directory) => (
        <li key={directory}>
          <Card className="lab-card">
            <Card.Header>
              <h2 className="directory-card-title">
                <Link to={`/${directory}`}>
                  {strings.directories[directory].title}
                </Link>
              </h2>
            </Card.Header>
            <Card.Body>
              <p className="lab-card-summary">
                {strings.directories[directory].description}
              </p>
            </Card.Body>
          </Card>
        </li>
      ))}
    </Columns>
  );
}
