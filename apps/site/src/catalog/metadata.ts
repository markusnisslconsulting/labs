import type { CatalogEntry } from "./schema";
import { localize } from "./localize";
import type { SiteStrings } from "../i18n/SiteStrings";
import { directoryAt } from "./directories";

export const siteOrigin = "https://labs.markusnissl.com";

export function routeMetadata(
  pathname: string,
  entries: CatalogEntry[],
  strings: SiteStrings,
  locale = "en",
) {
  const entry = entries.find((entry) => `/${entry.slug}` === pathname);
  const directory = directoryAt(pathname);
  const known = pathname === "/" || !!entry || !!directory;
  return {
    title: strings.pageTitle(
      entry
        ? localize(entry.title, locale)
        : directory
          ? strings.directories[directory].title
          : known
            ? strings.catalogTitle
            : strings.notFound,
    ),
    description: entry
      ? localize(entry.summary, locale)
      : directory
        ? strings.directories[directory].description
        : known
          ? strings.catalogDescription
          : strings.notFoundDescription,
    canonical: known ? siteOrigin + pathname : undefined,
    robots: known ? "index, follow" : "noindex, follow",
    image: `${siteOrigin}/logo.webp`,
    imageAlt: strings.socialImageAlt,
  };
}

export function metaTags(metadata: ReturnType<typeof routeMetadata>) {
  return [
    ["name", "description", metadata.description],
    ["name", "robots", metadata.robots],
    ["property", "og:title", metadata.title],
    ["property", "og:description", metadata.description],
    ["property", "og:type", "website"],
    ["property", "og:url", metadata.canonical],
    ["property", "og:image", metadata.image],
    ["property", "og:image:alt", metadata.imageAlt],
    ["name", "twitter:card", "summary"],
    ["name", "twitter:title", metadata.title],
    ["name", "twitter:description", metadata.description],
    ["name", "twitter:image", metadata.image],
    ["name", "twitter:image:alt", metadata.imageAlt],
  ] as const;
}
