import type { Preview } from "@storybook/react-vite";
import { create } from "storybook/theming";
import "../src/styles.css";

/** Docs pages read on the product palette, not Storybook defaults. */
const labsTheme = create({
  base: "light",
  brandTitle: "Labs UI · Markus Nissl",
  brandUrl: "https://labs.markusnissl.com",
  brandImage: "./logo.webp",
  colorPrimary: "#b31234",
  colorSecondary: "#172b4d",
  appBg: "#f7f9fc",
  appContentBg: "#ffffff",
  appBorderColor: "#d5dbe6",
  textColor: "#172b4d",
  textMutedColor: "#4b5870",
});

const preview: Preview = {
  // Padded global: Fokusringe mit outline-offset und Schatten müssen
  // in Chromatic-Snapshots vollständig sichtbar bleiben.
  parameters: {
    layout: "padded",
    docs: {
      theme: labsTheme,
      toc: { headingSelector: "h2, h3" },
    },
    themes: {
      themesList: [
        {
          id: "light",
          title: "Light",
          class: "theme-light",
          color: "#b31234",
          thumbnail: "./logo.webp",
        },
        {
          id: "dark",
          title: "Dark",
          class: "theme-dark",
          color: "#101828",
          thumbnail: "./logo.webp",
        },
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
    // Padding als echter Container: Chromatic schneidet Snapshots
    // auf die Komponente zu — Ringe und Schatten brauchen Raum.
    (Story) => (
      <div style={{ padding: "var(--uix-space-5)" }}>
        <Story />
      </div>
    ),
    (Story, context) => {
      const root = document.documentElement;
      root.dataset.density =
        context.globals.density === "compact" ? "compact" : "cozy";
      return Story();
    },
  ],
};

export default preview;
