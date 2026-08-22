import type { LabMeta } from "../types";

export default {
  slug: "workbench",
  title: "@labs/ui workbench",
  summary:
    "Every demo component, isolated in Storybook: states you can drive on your own, accessibility checks on each render, and the props visible next to the pixels.",
  explanation: [
    "The demos embedded in lab pages are composed views. In the workbench each component stands alone: you can drive its inputs, inspect its states and read its documentation without reading a line of prose first.",
    "Storybook runs an accessibility check on every story through the a11y addon, so contrast and landmark violations surface while the component is being written, not after a lab ship.",
    "Foundations documents the three token tiers — primitive values, semantic intent, per-component bindings — with contrast ratios computed live; a registry test fails the build if the CSS and the machine-readable tokens drift apart.",
  ],
  tags: ["components", "storybook"],
  article: {
    title: "Component workbench",
    href: "https://www.markusnissl.com/blog",
  },
  source: "https://github.com/markusnisslconsulting/labs/tree/main/packages/ui",
  storybookPath: "?path=/docs/introduction--page",
} satisfies LabMeta;
