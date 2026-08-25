import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { layerOrder } from "@labs/tools/vite-layer-order";
import react from "@vitejs/plugin-react";

// The ui package is consumed as source, so both the app and Storybook
// compile one copy of each component.
const uiSrc = fileURLToPath(new URL("../../packages/ui/src", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), layerOrder()],
  resolve: {
    alias: {
      "@labs/ui": uiSrc,
    },
  },
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
