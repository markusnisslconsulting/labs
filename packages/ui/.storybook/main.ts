import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/Introduction.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Enterprise posture: the workspace ships to customers, so the
  // tooling phones nothing home.
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
