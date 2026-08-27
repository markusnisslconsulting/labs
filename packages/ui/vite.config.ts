import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { layerOrder } from "@labs/tools/vite-layer-order";
import { assertClientDirectiveFirst } from "@labs/tools/vite-use-client";

const src = fileURLToPath(new URL("./src", import.meta.url));

/**
 * One entry per component, not a single bundle.
 *
 * Rollup emits a CSS file per entry that imports one, so
 * `@labs/ui/components/Badge` pulls Badge.css and nothing else. A single
 * entry would concatenate all of it into one stylesheet again and undo
 * the split.
 */
/** Shared stylesheets, as their own entries. */
const sharedSheetEntries = Object.fromEntries(
  readdirSync(`${src}/components`)
    .filter((file) => file.startsWith("_") && file.endsWith(".css"))
    .map((file) => [file.replace(/\.css$/, ""), `${src}/components/${file}`]),
);

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
 * the split exists to remove. This puts the import back so
 * `import { Badge } from "@labs/ui/components/Badge"` carries Badge.css in
 * the built output as it does from source.
 *
 * It reads the component's source, which is authoritative about what the
 * component needs. That only works because every shared stylesheet is now
 * a build entry of its own — see `sharedSheetEntries` above — so each name
 * in the source has a file with that name in the output.
 *
 * Before those entries existed, 11 of 47 imports in the published package
 * pointed at nothing:
 *
 *   _field.css   missing, imported by 10 components
 *   _choice.css  missing, imported by 1
 *
 * Vite had folded each shared stylesheet into the assets of the chunks
 * that imported it, and emitted one standalone copy named after whichever
 * entry happened to import nothing else — `_field.css` shipped as
 * `Field.css`. `_positioner.css` kept its own name, so the same bug
 * produced a working import there, which is why nobody saw it. TextField
 * shipped with no stylesheet at all.
 *
 * Two fixes were tried before this one, and both are worth naming because
 * they look right:
 *
 *   - Read `chunk.viteMetadata.importedCss` instead of the source. That
 *     is Vite's record of which asset a chunk *owns*, deduplicated across
 *     chunks — not which it depends on. Button, Combobox and TextField
 *     owned nothing and lost their stylesheet entirely.
 *   - Guess the renamed asset. Any mapping from source name to emitted
 *     name is inference, and the failure mode is a dead import in a
 *     published package.
 *
 * Making the shared sheets entries removes the guess: they are emitted
 * once, under their own names, and Vite stops copying them into the
 * component assets. Measured after: 47 of 47 imports resolve, and
 * `Checkbox.css` no longer carries the field rules it used to duplicate.
 * `scripts/check-size.mjs` fails the build if that stops being true.
 */
function keepCssImports() {
  return {
    name: "labs-keep-css-imports",
    generateBundle(_options: unknown, bundle: Record<string, unknown>) {
      for (const chunk of Object.values(bundle) as Array<{
        type: string;
        fileName?: string;
        facadeModuleId?: string | null;
        code?: string;
        viteMetadata?: { importedCss?: Set<string> };
      }>) {
        if (chunk.type !== "chunk" || !chunk.facadeModuleId) continue;
        if (!chunk.facadeModuleId.endsWith(".tsx")) continue;

        /* From the component's source, which is authoritative about what
           it needs, now that every one of those names is a file the build
           actually emits. Vite's own `viteMetadata.importedCss` was tried
           instead and is the wrong record: it reports which asset a chunk
           *owns*, deduplicated across chunks, so Button, Combobox and
           TextField owned nothing at all and lost their stylesheet
           entirely. Ownership is not dependency. */
        const sheets = [
          ...readFileSync(chunk.facadeModuleId, "utf8").matchAll(
            /import "\.\/([\w-]+)\.css";/g,
          ),
        ].map((hit) => `import "../${hit[1]}.css";`);
        if (!sheets.length) continue;

        // Insert *after* a leading "use client", not before it. A
        // directive is only a directive while it is the first statement;
        // putting an import above it turns it into a string expression
        // that evaluates and is thrown away, and the component silently
        // becomes a server component in the consumer's build.
        const directive = /^\s*(["']use client["'];?)\s*/.exec(
          chunk.code ?? "",
        );
        const block = sheets.join("\n");
        chunk.code = directive
          ? `${directive[1]}\n${block}\n${(chunk.code ?? "").slice(directive[0].length)}`
          : `${block}\n${chunk.code}`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    keepCssImports(),
    layerOrder(),
    assertClientDirectiveFirst(),
  ],
  build: {
    outDir: fileURLToPath(new URL("../../dist/packages/ui", import.meta.url)),
    emptyOutDir: true,
    // Off by default in library mode, which would inline every
    // component's CSS into one file — the opposite of the goal.
    cssCodeSplit: true,
    lib: {
      entry: {
        index: `${src}/index.ts`,
        // A public export needs its own entry, or the published exports
        // map points at a file the build never wrote. publint said so.
        "tokens.registry": `${src}/tokens.registry.ts`,
        ...componentEntries,
        ...sharedSheetEntries,
      },
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
