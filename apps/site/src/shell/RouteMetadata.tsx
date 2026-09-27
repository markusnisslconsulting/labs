import { useEffect } from "react";
import { useLocation } from "react-router";
import { catalog } from "../catalog";
import { metaTags, routeMetadata } from "../catalog/metadata";
import { useSiteStrings } from "../i18n/SiteStrings";

export function RouteMetadata() {
  const { pathname } = useLocation();
  const { strings, locale } = useSiteStrings();
  useEffect(() => {
    const metadata = routeMetadata(pathname, catalog, strings, locale);
    document.title = metadata.title;
    for (const [attribute, name, value] of metaTags(metadata)) {
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      );
      if (value === undefined) {
        element?.remove();
        continue;
      }
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.append(element);
      }
      element.content = value;
    }
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (metadata.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.append(canonical);
      }
      canonical.href = metadata.canonical;
    } else canonical?.remove();
  }, [pathname, strings, locale]);
  return null;
}
