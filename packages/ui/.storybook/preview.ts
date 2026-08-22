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
