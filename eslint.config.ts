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
  {
    /**
     * A scrollable region is allowed to be a tab stop.
     *
     * `no-noninteractive-tabindex` is right that `tabindex="0"` on
     * something inert puts a stop in the tab order that leads nowhere. A
     * scroll container is the exception the rule does not model:
     * `overflow` creates an area a pointer can scroll and a keyboard
     * cannot reach at all, which is WCAG 2.1.1 in its plainest form, and
     * the fix is exactly the tab stop the rule forbids.
     *
     * Allowed by role rather than per line because it is a pattern here,
     * not an incident: `Table` and `DataTable` both do it, and `Table`
     * escaped the rule only because it computes its role from a prop —
     * the rule cannot read a dynamic value, so the same code passed in
     * one file and failed in the other. A rule that depends on how the
     * attribute was spelled is not enforcing anything.
     *
     * `region` demands a name to be a region at all, so this does not
     * license an anonymous tab stop: both components pass the caption as
     * `aria-label`.
     */
    rules: {
      "jsx-a11y/no-noninteractive-tabindex": [
        "error",
        {
          tags: [],
          roles: ["tabpanel", "region"],
          allowExpressionValues: true,
        },
      ],
    },
  },
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
            {
              // Tooling sits outside the layering: a gate has to be able
              // to read whatever it checks. Stated rather than left to the
              // fall-through, so the exemption is visible.
              sourceTag: "type:tooling",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
);
