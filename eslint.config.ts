import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { FlatCompat } from "@eslint/eslintrc";
import nxPlugin from "@nx/eslint-plugin";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// The hooks plugin ships both legacy and flat shapes depending on its
// major; the flat shape is an array of config objects, the legacy one
// a single object. Normalise to entries scoped to TS sources.
const hooksConfigRaw =
  reactHooks.configs?.["recommended-latest"] ?? reactHooks.configs?.recommended;
const hooksEntries = (
  Array.isArray(hooksConfigRaw) ? hooksConfigRaw : [hooksConfigRaw]
)
  .filter((entry) => Boolean(entry))
  .map((entry) => ({ ...entry, files: ["**/*.{ts,tsx}"] }));

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.nx/**",
      "**/storybook-static/**",
    ],
  },
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  ...hooksEntries,
  {
    // The module-boundary rule lives in the Nx plugin; registering it
    // here keeps package imports declarative and lint-checkable.
    plugins: { "@nx": nxPlugin },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          // Build tooling is not part of any library's runtime graph: a
          // vite config importing a plugin says nothing about what the
          // published package depends on. Allowing it by name keeps the
          // rule strict everywhere it actually describes shipping code.
          allow: ["@labs/tools/*"],
          depConstraints: [
            // Scope answers "whose code may I use", type answers "which
            // layer am I in". Scope alone let the design system import a
            // feature: packages/ui and packages/reorder-desk are both
            // scope:shared, so nothing stopped a button from reaching
            // into a product screen, and the day it happened the design
            // system would stop being independently publishable.
            {
              sourceTag: "scope:site",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
            {
              sourceTag: "scope:shared",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
            // The layering, from the top down. Each may use what is below
            // it and never what is beside or above it.
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: ["type:feature", "type:ui"],
            },
            {
              sourceTag: "type:feature",
              onlyDependOnLibsWithTags: ["type:ui"],
            },
            {
              // The leaf. A design system that depends on a product is no
              // longer a design system.
              sourceTag: "type:ui",
              onlyDependOnLibsWithTags: [],
            },
          ],
        },
      ],
    },
  },
);
