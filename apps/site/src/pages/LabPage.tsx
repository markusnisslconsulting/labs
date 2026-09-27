import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Button } from "@labs/ui/components/Button";
import { Cluster } from "@labs/ui/components/Cluster";
import { PageHeader } from "@labs/ui/components/PageHeader";
import { Panel } from "@labs/ui/components/Panel";
import { Stack } from "@labs/ui/components/Stack";
import { catalogBySlug, demoComponents, storybookHref } from "../catalog";
import { catalogReturn } from "../catalog/filters";
import { localize } from "../catalog/localize";
import { useSiteStrings } from "../i18n/SiteStrings";
import { NotFoundPage } from "./NotFoundPage";
import { DemoSurface } from "../recovery/DemoSurface";
import { useHydrated } from "../hydration";

export function LabPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { strings, locale } = useSiteStrings();
  const lab = catalogBySlug(slug);
  const [showPreview, setShowPreview] = useState(false);
  const hydrated = useHydrated();
  if (!lab) return <NotFoundPage />;
  const Demo = demoComponents[lab.slug];
  const state = location.state as { catalogReturn?: unknown } | null;
  const returnTo = catalogReturn(hydrated ? state?.catalogReturn : undefined);
  return (
    <Stack gap="lg" renderAs={<article />} className="page">
      <PageHeader
        title={localize(lab.title, locale)}
        actions={
          lab.renderer.type === "storybook" ? (
            <Button
              renderAs={
                <a href={storybookHref(lab.renderer)}>
                  {strings.openStorybook}
                </a>
              }
            >
              {strings.openStorybook}
            </Button>
          ) : undefined
        }
        breadcrumb={<Link to={returnTo}>{strings.backToCatalog}</Link>}
      />
      {localize(lab.explanation, locale).map((paragraph) => (
        <p className="page-lede" key={paragraph}>
          {paragraph}
        </p>
      ))}
      <Cluster
        gap="lg"
        renderAs={<ul />}
        className="link-row plain-list"
        aria-label={strings.resources}
      >
        {lab.resources.map((resource) => (
          <li key={resource.href}>
            <a href={resource.href} target="_blank" rel="noopener noreferrer">
              {localize(resource.title, locale)} ↗
            </a>
          </li>
        ))}
      </Cluster>
      {lab.requirements.length ? (
        <Panel label={strings.requirements}>
          <ul>
            {lab.requirements.map((requirement) => (
              <li key={requirement.id}>
                <strong>{localize(requirement.title, locale)}</strong>:{" "}
                {localize(requirement.detail, locale)}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {Demo ? (
        <DemoSurface key={lab.slug} component={Demo} returnTo={returnTo} />
      ) : null}
      {lab.renderer.type === "storybook" ? (
        <Stack gap="lg" align="start">
          <p>{strings.workbenchDescription}</p>
          <Cluster gap="md">
            <Button
              variant="outline"
              aria-expanded={showPreview}
              aria-controls="workbench-preview"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? strings.hidePreview : strings.showPreview}
            </Button>
          </Cluster>
          <div
            id="workbench-preview"
            className="workbench-preview"
            hidden={!showPreview}
          >
            {showPreview ? (
              <Panel label={strings.embeddedPreview}>
                <iframe
                  title={strings.storybookFrame(localize(lab.title, locale))}
                  src={storybookHref(lab.renderer)}
                  className="story-frame"
                />
              </Panel>
            ) : null}
          </div>
        </Stack>
      ) : null}
    </Stack>
  );
}
