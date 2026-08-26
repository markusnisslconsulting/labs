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
     * Explicit navigation order. Without it Storybook falls back to the
     * order files happen to be discovered in, so the sidebar reorders
     * itself whenever a file is added or renamed — the reader's map of
     * the system changes for reasons that have nothing to do with the
     * system. Read top to bottom: what it is, what it is made of, what
     * it offers, how the pieces go together.
     */
    options: {
      storySort: {
        order: [
          "Introduction",
          "Guides",
          ["Theming", "Accessibility", "Deprecation", "Contributing"],
          "Foundations",
          [
            "Tokens",
            ["Overview", "Primitive", "Semantic", "Component", "Slots"],
            "Brands",
            "Focus",
          ],
          "Components",
          "Patterns",
        ],
      },
    },
    /**
     * A violation fails the story rather than merely reporting it. The
     * test runner asserts the same rules headless in CI, so this is a
     * gate and not a panel someone has to remember to read.
     */
    a11y: { test: "error" },
    /**
     * Three widths, named for the decision rather than a device: the
     * point is where the layout has to change, not which phone.
     */
    viewport: {
      options: {
        narrow: {
          name: "Narrow (390)",
          styles: { width: "390px", height: "780px" },
        },
        medium: {
          name: "Medium (768)",
          styles: { width: "768px", height: "900px" },
        },
        wide: {
          name: "Wide (1280)",
          styles: { width: "1280px", height: "900px" },
        },
      },
    },
    /**
     * Snapshot every story in both themes.
     *
     * Dark mode was unreachable for months and then, once reachable,
     * still had zero visual coverage: the contrast gate can prove a
     * pairing is legible, but only a picture catches a component that
     * forgot to remap. Modes drive the same globals the toolbar does,
     * so what Chromatic captures is what a reader sees.
     *
     * Cost is deliberate: this doubles snapshots per changed story, and
     * TurboSnap keeps that to the stories a commit actually touches.
     * Brand coverage is not global for the same reason — it is set on
     * the Brands story, where a brand difference is the subject.
     */
    chromatic: {
      /**
       * Snapshotting is opt-in.
       *
       * Measured, not assumed: a full build captured 240 snapshots while
       * the projection said 114. The gap is Storybook's autodocs pages,
       * which Chromatic photographs like any other entry — 44 of them,
       * each one the same components in a documentation shell.
       *
       * There is no documented way to keep a docs page and skip its
       * snapshot, but story parameters override the project default. So
       * the default is off, and each component turns exactly one story
       * back on with `disableSnapshot: false`. Every snapshot is then a
       * visible line someone chose, and the budget gate refuses a
       * component that turned none on.
       */
      disableSnapshot: true,
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark" },
      },
    },
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
    direction: {
      name: "Direction",
      description: "Writing direction; the layout must mirror, not shift",
      toolbar: {
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
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
  initialGlobals: { brand: "default", density: "default", direction: "ltr" },
  decorators: [
    // Padding as a real container: Chromatic crops snapshots to the
    // component, and focus rings with outline-offset need the room.
    (Story) => (
      <div style={{ padding: "var(--uix-space-5)" }}>
        <Story />
      </div>
    ),
    withRootAttribute("data-density", "density"),
    // `dir` is a real attribute rather than a class, so logical properties
    // and the browser's own bidi handling do the work. A component that
    // used left/right instead of inline-start/end shows up immediately.
    withRootAttribute("dir", "direction"),
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
