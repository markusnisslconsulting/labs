import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Alert } from "@labs/ui/components/Alert";
import { Button } from "@labs/ui/components/Button";
import { Cluster } from "@labs/ui/components/Cluster";
import { PageHeader } from "@labs/ui/components/PageHeader";
import { Stack } from "@labs/ui/components/Stack";
import { useSiteStrings } from "../i18n/SiteStrings";

export function RecoveryNotice({
  kind,
  returnTo,
  retry,
}: {
  kind: "load" | "render" | "page";
  returnTo: string;
  retry: () => void;
}) {
  const { strings } = useSiteStrings();
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primary.current?.focus();
  }, []);
  const title =
    kind === "page"
      ? strings.pageFailed
      : kind === "load"
        ? strings.demoLoadFailed
        : strings.demoFailed;
  const description =
    kind === "page"
      ? strings.pageFailedDescription
      : kind === "load"
        ? strings.demoLoadFailedDescription
        : strings.demoFailedDescription;
  const reload = () => window.location.reload();
  return (
    <Stack gap="lg">
      {kind === "page" ? <PageHeader title={title} /> : null}
      <Alert severity="danger" title={kind === "page" ? undefined : title}>
        <p>{description}</p>
      </Alert>
      <Cluster gap="md">
        <Button ref={primary} onClick={kind === "load" ? reload : retry}>
          {kind === "load"
            ? strings.reloadPage
            : kind === "page"
              ? strings.retryPage
              : strings.restartDemo}
        </Button>
        {kind !== "load" ? (
          <Button variant="outline" onClick={reload}>
            {strings.reloadPage}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          renderAs={
            kind === "page" ? (
              <a href={returnTo}>{strings.backToCatalog}</a>
            ) : (
              <Link to={returnTo}>{strings.backToCatalog}</Link>
            )
          }
        >
          {strings.backToCatalog}
        </Button>
      </Cluster>
    </Stack>
  );
}
