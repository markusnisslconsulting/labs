import { NavLink } from "react-router";
import { Cluster } from "@labs/ui/components/Cluster";
import { directories } from "../catalog/directories";
import { useSiteStrings } from "../i18n/SiteStrings";

export function DirectoryNav() {
  const { strings } = useSiteStrings();
  return (
    <Cluster
      gap="lg"
      renderAs={<nav />}
      aria-label={strings.directoryNavigation}
      className="site-nav directory-nav"
    >
      <NavLink to="/" end>
        {strings.overview}
      </NavLink>
      {directories.map((directory) => (
        <NavLink key={directory} to={`/${directory}`}>
          {strings.directories[directory].title}
        </NavLink>
      ))}
    </Cluster>
  );
}
