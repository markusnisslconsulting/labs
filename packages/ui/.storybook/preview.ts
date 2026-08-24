import type { Preview } from "@storybook/react-vite";
import { create } from "storybook/theming";
import "../src/styles.css";

/** Docs pages read on the product palette, not Storybook defaults. */
const labsTheme = create({
  base: "light",
  brandTitle: "Labs UI · Markus Nissl",
  brandUrl: "https://labs.markusnissl.com",
  colorPrimary: "#e5173f",
  colorSecondary: "#172b4d",
  appBg: "#f7f9fc",
  appContentBg: "#ffffff",
  appBorderColor: "#d5dbe6",
  textColor: "#172b4d",
  textMutedColor: "#4b5870",
});

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Semantic token set",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        defaultValue: "light",
      },
    },
    density: {
      name: "Density",
      description: "Spacing multiplier",
      toolbar: {
        icon: "contrast",
        items: [
          { value: "cozy", title: "Cozy", icon: "expand" },
          { value: "compact", title: "Compact", icon: "collapse" },
        ],
        defaultValue: "cozy",
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Die Attribute sitzen am html-Element des Story-iframes, damit
      // die semantischen Tokens (und die Density) überall greifen.
      const root = document.documentElement;
      root.dataset.theme = context.globals.theme ?? "light";
      root.dataset.density =
        context.globals.density === "compact" ? "compact" : "cozy";
      return Story();
    },
  ],
  parameters: {
    layout: "padded",
    a11y: {
      // Axe findings fail the test runner; they never ship as warnings.
      test: "error",
    },
    docs: {
      theme: labsTheme,
      toc: { headingSelector: "h2, h3" },
    },
    options: {
      storySort: {
        order: [
          "Introduction",
          ["Page"],
          "Foundations",
          "Components",
          "Demos",
          "*",
        ],
      },
    },
  },
};

export default preview;
