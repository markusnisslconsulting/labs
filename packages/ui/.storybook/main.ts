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
