import type { ComponentType } from "react";

/**
 * A lab is self-describing: one folder under apps/site/src/labs/, one
 * default export. The registry picks folders up automatically, so
 * adding a lab means adding a folder — nothing else.
 */
export interface LabMeta {
  /** URL segment: labs.markusnissl.com/<slug> */
  slug: string;
  title: string;
  /** One line on the overview card. */
  summary: string;
  /** Paragraphs for the lab page, in order. */
  explanation: string[];
  tags: string[];
  article: {
    title: string;
    href: string;
  };
  /** Where the code for this lab lives in the public repository. */
  source: string;
  /**
   * Live example, if the lab showcases something running in a browser.
   *
   * A loader, not a component: the demo and every design-system
   * component it renders — and therefore their CSS — arrive only when
   * someone opens this lab, not when the overview page loads.
   */
  demo?: () => Promise<{ default: ComponentType }>;
  /** Path into the hosted Storybook, if the lab has stories. */
  storybookPath?: string;
}
