import type { ReactNode } from "react";
import { Link } from "react-router";
import { Cluster } from "@labs/ui/components/Cluster";
import { Container } from "@labs/ui/components/Container";
import { Stack } from "@labs/ui/components/Stack";
import { useSiteStrings } from "../i18n/SiteStrings";
import { Navigation } from "./Navigation";
import { RouteMetadata } from "./RouteMetadata";
import { DirectoryNav } from "../components/DirectoryNav";

export function SiteShell({ children }: { children: ReactNode }) {
  const { strings, locale } = useSiteStrings();
  return (
    <div className="site-shell" lang={locale}>
      <Navigation />
      <RouteMetadata />
      <a className="skip-link" href="#main">
        {strings.skipToContent}
      </a>
      <header className="site-header">
        <Container className="site-header-inner">
          <Cluster gap="lg" justify="between" align="center">
            <Link to="/" className="site-brand">
              <span className="site-logo" aria-hidden="true" />
              {strings.brand}
            </Link>
            <Cluster
              gap="lg"
              renderAs={<nav />}
              className="site-nav"
              aria-label={strings.primaryNavigation}
            >
              <Link to="/workbench">{strings.storybook}</Link>
              <a href="https://github.com/markusnisslconsulting/labs">
                {strings.source}
              </a>
              <a href="https://www.markusnissl.com/blog">{strings.writing}</a>
            </Cluster>
          </Cluster>
          <DirectoryNav />
        </Container>
      </header>
      <Container renderAs={<main />} id="main" tabIndex={-1}>
        <noscript>
          <p>{strings.javascriptRequired}</p>
        </noscript>
        {children}
      </Container>
      <footer className="site-footer">
        <Container>
          <Stack gap="md">
            <p>{strings.footerDescription}</p>
            <Cluster
              gap="lg"
              renderAs={<nav />}
              aria-label={strings.footerNavigation}
            >
              <a href="https://www.markusnissl.com/">{strings.mainSite}</a>
              <a href="https://www.markusnissl.com/legal-notice">
                {strings.legal}
              </a>
              <a href="https://www.markusnissl.com/privacy-policy">
                {strings.privacy}
              </a>
            </Cluster>
          </Stack>
        </Container>
      </footer>
    </div>
  );
}
