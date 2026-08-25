import type { Preview } from "@storybook/react-vite";
import { create } from "storybook/theming";
import "../src/styles.css";

/** Docs pages read on the product palette, not Storybook defaults. */
const labsTheme = create({
  base: "light",
  brandTitle: "Labs UI · Markus Nissl",
  brandUrl: "https://labs.markusnissl.com",
  brandImage: "./logo.webp",
  colorPrimary: "#e5173f",
  colorSecondary: "#172b4d",
  appBg: "#f7f9fc",
  appContentBg: "#ffffff",
  appBorderColor: "#d5dbe6",
  textColor: "#172b4d",
  textMutedColor: "#4b5870",
});

const preview: Preview = {
  // Theme über @storybook/addon-themes (Klasse auf body); Density
  // bleibt ein eigener globalType, weil es kein Theme, sondern ein
  // Mass ist.
  parameters: {
    themes: {
      themesList: [
        { id: "light", title: "Light", class: "theme-light", color: "#b31234" },
        { id: "dark", title: "Dark", class: "theme-dark", color: "#101828" },
      ],
      defaultTheme: "light",
    },
  },
  globalTypes: {
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
