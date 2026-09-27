import { fileURLToPath } from "node:url";
import { publicModules } from "@labs/tools/vite-public-modules";
import { workbenchFacts } from "@labs/tools/vite-workbench-facts";
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
    "@storybook/addon-vitest",
    "storybook-addon-tag-badges",
    {
      // MDX tables require GFM.
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
  viteFinal(config) {
    config.build ??= {};
    config.build.cssMinify = "esbuild";
    config.optimizeDeps ??= {};
    config.optimizeDeps.include ??= [];
    config.optimizeDeps.include.push(
      "@base-ui-components/react/direction-provider",
    );
    config.plugins ??= [];
    config.plugins.push(
      publicModules(fileURLToPath(new URL("../../..", import.meta.url))),
      workbenchFacts(fileURLToPath(new URL("../../..", import.meta.url))),
    );
    return config;
  },
  staticDirs: [
    "./public",
    { from: "../../brand/src/logos", to: "/brand" },
    { from: "../../brand/src/licenses", to: "/font-licenses" },
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
};

export default config;
