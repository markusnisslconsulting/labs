import { Link } from "react-router";
import { Button } from "@labs/ui/components/Button";
import { PageHeader } from "@labs/ui/components/PageHeader";
import { Stack } from "@labs/ui/components/Stack";
import { useSiteStrings } from "../i18n/SiteStrings";

export function NotFoundPage() {
  const { strings } = useSiteStrings();
  return (
    <Stack gap="lg" align="start" className="page">
      <PageHeader
        title={strings.notFound}
        description={strings.notFoundDescription}
      />
      <Button renderAs={<Link to="/" />}>{strings.backToCatalog}</Button>
    </Stack>
  );
}
