import { createContext, useContext, type ReactNode } from "react";

export const english = {
  brand: "Labs",
  socialImageAlt: "Markus Nissl logo",
  pageTitle: (title: string) => `${title} · Labs · Markus Nissl`,
  javascriptRequired:
    "Enable JavaScript to use search and interactive demos. You can still browse every entry and read its description.",
  demoReady: "Enable JavaScript to load the interactive demo.",
  primaryNavigation: "Primary",
  directoryNavigation: "Explore Labs",
  overview: "Overview",
  directories: {
    demos: {
      title: "Demos",
      description:
        "Run focused examples and check their browser requirements before starting.",
    },
    components: {
      title: "Components",
      description:
        "Find reusable controls and layout pieces, then open their props and examples in Storybook.",
    },
    patterns: {
      title: "Patterns",
      description:
        "Explore complete compositions built from shared components and adaptable content.",
    },
    foundations: {
      title: "Foundations",
      description:
        "Browse tokens, focus styles, theming and accessibility guidance in the full workbench.",
    },
  },
  viewExample: "View example",
  searchDirectory: (title: string) => `Search ${title.toLocaleLowerCase("en")}`,
  statusFilter: "Component status",
  allStatuses: "All statuses",
  componentStatus: {
    stable: "Stable",
    beta: "Beta",
    experimental: "Experimental",
    deprecated: "Deprecated",
  },
  referenceKind: {
    component: "Component",
    foundation: "Foundation",
    guide: "Guide",
  },
  footerNavigation: "About this site",
  skipToContent: "Skip to content",
  storybook: "Storybook",
  source: "GitHub",
  writing: "Writing",
  mainSite: "Markus Nissl Consulting",
  legal: "Legal notice",
  privacy: "Privacy policy",
  footerDescription:
    "Interactive examples and reusable UI from Markus Nissl Consulting.",
  catalogTitle: "Demos and UI workbench",
  catalogDescription:
    "Explore interactive examples, inspect component states, and follow the articles behind them. Some scenarios need browser features that are not available on every device.",
  search: "Search the labs",
  filterTags: "Filter by tag",
  allTags: "All",
  filterExecution: "Execution mode",
  allExecutions: "All execution modes",
  execution: {
    scripted: "Scripted example",
    browser: "Standard browser features",
    native: "Native browser API required",
    integration: "External service required",
    storybook: "Storybook",
  },
  count: (visible: number, total: number) =>
    `${visible} of ${total} ${total === 1 ? "entry" : "entries"}`,
  noMatches: "Nothing matched",
  noMatchesDescription:
    "Try a different search or clear the filters to see all entries.",
  clearFilters: "Clear the filters",
  tags: "Tags",
  openLab: "Open the lab",
  readArticle: "Read the article",
  backToCatalog: "Back to the catalog",
  notFound: "This lab does not exist.",
  notFoundDescription: "Choose an example from the catalog.",
  resources: "Links for this lab",
  requirements: "Requirements",
  loadingDemo: "Loading the demo…",
  interactiveDemo: "Interactive demo",
  demoLoadFailed: "The demo could not load.",
  demoLoadFailedDescription:
    "Reload the page to try again. You can still read the lab details or return to the catalog.",
  demoFailed: "The demo stopped working.",
  demoFailedDescription:
    "Restart the demo to clear its inputs and results, or reload the page.",
  pageFailed: "This page could not be displayed.",
  pageFailedDescription:
    "Try again or return to the catalog. Reloading may help if the problem continues.",
  retryPage: "Try again",
  restartDemo: "Restart demo",
  reloadPage: "Reload page",
  openStorybook: "Open in Storybook",
  embeddedPreview: "Embedded preview",
  showPreview: "Show embedded preview",
  hidePreview: "Hide embedded preview",
  workbenchDescription:
    "Open the full workbench to browse components and documentation. An embedded preview is also available below.",
  storybookFrame: (title: string) => `${title} in Storybook`,
};

export type SiteStrings = typeof english;
const SiteContext = createContext({ locale: "en", strings: english });

export function SiteStringsProvider({
  locale = "en",
  strings,
  children,
}: {
  locale?: string;
  strings?: Partial<SiteStrings>;
  children: ReactNode;
}) {
  return (
    <SiteContext.Provider
      value={{ locale, strings: { ...english, ...strings } }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export const useSiteStrings = () => useContext(SiteContext);
