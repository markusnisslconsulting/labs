import type { Decorator, Preview } from "@storybook/react-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { useEffect } from "react";
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

/**
 * Set a root data attribute from a toolbar global.
 *
 * An effect, not a render-time mutation: in docs mode many stories
 * render onto one page, and assigning during render lets whichever
 * story rendered last win. Cleanup also removes the attribute, so
 * switching back to the default leaves no stale state behind.
 */
function withRootAttribute(attribute: string, globalKey: string): Decorator {
  return (Story, context) => {
    const value = context.globals[globalKey] as string | undefined;
    useEffect(() => {
      const root = document.documentElement;
      if (!value || value === "default") {
        root.removeAttribute(attribute);
        return;
      }
      root.setAttribute(attribute, value);
      return () => root.removeAttribute(attribute);
    }, [value]);
    return <Story />;
  };
}

const preview: Preview = {
  parameters: {
    layout: "padded",
    docs: { theme: labsTheme, toc: { headingSelector: "h2, h3" } },
    /**
     * A violation fails the story rather than merely reporting it. The
     * test runner asserts the same rules headless in CI, so this is a
     * gate and not a panel someone has to remember to read.
     */
    a11y: { test: "error" },
  },
  globalTypes: {
    brand: {
      name: "Brand",
      description: "Semantic-layer brand override",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "default", title: "Labs (default)" },
          { value: "ocean", title: "Ocean" },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      name: "Density",
      description: "Spacing multiplier",
      toolbar: {
        icon: "contrast",
        items: [
          { value: "default", title: "Cozy", icon: "expand" },
          { value: "compact", title: "Compact", icon: "collapse" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { brand: "default", density: "default" },
  decorators: [
    // Padding as a real container: Chromatic crops snapshots to the
    // component, and focus rings with outline-offset need the room.
    (Story) => (
      <div style={{ padding: "var(--uix-space-5)" }}>
        <Story />
      </div>
    ),
    withRootAttribute("data-density", "density"),
    withRootAttribute("data-brand", "brand"),
    /**
     * The theme switcher. This decorator is what registers the theme
     * list with the toolbar — declaring `parameters.themes.themesList`
     * does nothing, because that is the API of a different, deprecated
     * addon and this one reads its list from the decorator instead.
     */
    withThemeByDataAttribute({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
