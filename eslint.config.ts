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
          allow: [],
          depConstraints: [
            {
              sourceTag: "scope:site",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
            {
              sourceTag: "scope:shared",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
          ],
        },
      ],
    },
  },
);
