import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { storybookMount } from "@labs/release-tools/vite-storybook";
import { publicModules } from "@labs/tools/vite-public-modules";
import { layerOrder } from "@labs/tools/vite-layer-order";
import { catalogValidation } from "./scripts/catalog-plugin.ts";
import { workbenchDirectory } from "./scripts/workbench-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  ssr: { noExternal: ["@labs/ui"] },
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
    react(),
    publicModules(fileURLToPath(new URL("../..", import.meta.url))),
    layerOrder(),
    catalogValidation(),
    workbenchDirectory(),
    storybookMount(
      fileURLToPath(
        new URL("../../dist/packages/ui-storybook", import.meta.url),
      ),
    ),
  ],
  server: { port: 4300 },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    // lightningcss rewrites `@layer a, b, c;` down to only the layers it
    // cannot see a block for, which is sound only if the block order in
    // the bundle already matches. It does not: component CSS arrives from
    // JS module imports and lands before the entry's @import-ed tokens and
    // base, so dropping the statement silently reordered base above
    // components and every component rule lost. esbuild leaves it alone.
    cssMinify: "esbuild",
  },
});
