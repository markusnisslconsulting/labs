import { defineConfig } from "vite";
import { resolve } from "node:path";

/**
 * A real bundler, asked what a consumer actually downloads.
 *
 * `scripts/check-size.mjs` already reads the emitted chunks and looks for
 * a component importing a stylesheet that is not its own. That is static
 * analysis of our own output, and it has been wrong before in exactly the
 * way static analysis goes wrong: an earlier version of it matched only
 * minified import statements while the chunks are unminified, so it
 * matched nothing and reported success for every component.
 *
 * This asks the question from the other side. It builds two tiny
 * applications that use one component — one importing through the barrel,
 * one by subpath — and the check compares what Rollup decided to keep.
 * That is the guarantee as a consumer experiences it: `sideEffects`,
 * `exports`, the barrel's shape and the per-component chunking all have
 * to be right together for it to hold, and only a bundler evaluates all
 * four at once.
 */
const entry = process.env.ENTRY ?? "barrel";
const UI = resolve(import.meta.dirname, "../../dist/packages/ui");

export default defineConfig({
  logLevel: "error",
  resolve: {
    alias: [
      { find: /^@labs\/ui$/, replacement: `${UI}/index.js` },
      { find: /^@labs\/ui\/(.*)$/, replacement: `${UI}/$1` },
    ],
  },
  build: {
    outDir: resolve(import.meta.dirname, `.out/${entry}`),
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: resolve(import.meta.dirname, `src/${entry}.tsx`),
      formats: ["es"],
      fileName: "app",
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime", "react-dom"],
    },
  },
});
