import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const src = fileURLToPath(new URL("./src", import.meta.url));

/**
 * One entry per component, not a single bundle.
 *
 * Rollup emits a CSS file per entry that imports one, so
 * `@labs/ui/components/Badge` pulls Badge.css and nothing else. A single
 * entry would concatenate all of it into one stylesheet again and undo
 * the split.
 */
const componentEntries = Object.fromEntries(
  readdirSync(`${src}/components`)
    .filter((file) => file.endsWith(".tsx") && !file.includes(".stories."))
    .map((file) => [
      `components/${file.replace(/\.tsx$/, "")}`,
      `${src}/components/${file}`,
    ]),
);

/**
 * Library mode extracts each entry's CSS to its own file but strips the
 * `import "./X.css"` from the emitted JS, which would leave consumers of
 * the built package importing stylesheets by hand — exactly the coupling
 * the split exists to remove. This puts the import back, pointing at the
 * emitted file, so `import { Badge } from "@labs/ui/components/Badge"`
 * carries Badge.css in the built output as it does from source.
 */
function keepCssImports() {
  return {
    name: "labs-keep-css-imports",
    generateBundle(_options: unknown, bundle: Record<string, unknown>) {
      for (const chunk of Object.values(bundle) as Array<{
        type: string;
        facadeModuleId?: string | null;
        code?: string;
      }>) {
        if (chunk.type !== "chunk" || !chunk.facadeModuleId) continue;
        if (!chunk.facadeModuleId.endsWith(".tsx")) continue;
        const sheets = [
          ...readFileSync(chunk.facadeModuleId, "utf8").matchAll(
            /import "\.\/([\w-]+)\.css";/g,
          ),
        ].map((hit) => `import "../${hit[1]}.css";`);
        if (sheets.length) chunk.code = `${sheets.join("\n")}\n${chunk.code}`;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), keepCssImports()],
  build: {
    outDir: fileURLToPath(new URL("../../dist/packages/ui", import.meta.url)),
    emptyOutDir: true,
    // Off by default in library mode, which would inline every
    // component's CSS into one file — the opposite of the goal.
    cssCodeSplit: true,
    lib: {
      entry: { index: `${src}/index.ts`, ...componentEntries },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "lucide-react",
        /^@base-ui-components\//,
      ],
      output: { preserveModules: false, entryFileNames: "[name].js" },
    },
  },
  test: {
    include: ["test/**/*.spec.ts"],
    root: fileURLToPath(new URL("../..", import.meta.url)),
  },
});
