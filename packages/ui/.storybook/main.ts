import remarkGfm from "remark-gfm";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/Introduction.mdx",
    "../src/guides/*.mdx",
    "../src/foundations/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    // Runs every story as a Vitest test in a real browser. It replaced
    // @storybook/test-runner, which Storybook deprecates and which warned
    // on every run: this shares one Vitest instance with the rest of the
    // suite, supports watch mode and coverage, and reuses the browser
    // rather than driving it through a second harness.
    "@storybook/addon-vitest",
    // Surfaces the status tag as a badge in the sidebar. Every component
    // already declared "stable" or "beta"; until now nothing rendered it,
    // so the maturity metadata existed for a linter and not for the
    // person deciding whether to build on a component.
    "storybook-addon-tag-badges",
    {
      // MDX 3 has no tables without GFM, so every table in the guides
      // rendered as a row of pipes until this was added.
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: { remarkPlugins: [remarkGfm] },
        },
      },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  staticDirs: ["./public"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Enterprise posture: the workspace ships to customers, so the
  // tooling phones nothing home.
  core: {
    disableTelemetry: true,
  },
};

export default config;
