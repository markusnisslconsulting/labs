import type { Linter } from "eslint";
import tseslint from "typescript-eslint";
import reactHooksImport from "eslint-plugin-react-hooks";
const reactHooks = reactHooksImport as unknown as {
  configs: Record<string, Linter.Config[]>;
};
import jsxA11y from "eslint-plugin-jsx-a11y";
import nxPlugin from "@nx/eslint-plugin";
import boundaries from "@labs/checks/eslint-boundaries";

const hooks =
  reactHooks.configs["recommended-latest"] ?? reactHooks.configs.recommended;
const hooksEntries = (Array.isArray(hooks) ? hooks : [hooks]).map((entry) => ({
  ...entry,
  files: ["**/*.{ts,tsx}"],
}));
const constraints = [
  { sourceTag: "scope:site", onlyDependOnLibsWithTags: ["scope:shared"] },
  { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
  {
    sourceTag: "type:app",
    onlyDependOnLibsWithTags: ["type:domain", "type:contract", "type:ui"],
  },
  {
    sourceTag: "type:domain",
    onlyDependOnLibsWithTags: ["type:domain", "type:contract"],
  },
  { sourceTag: "type:contract", onlyDependOnLibsWithTags: ["type:contract"] },
  { sourceTag: "type:ui", onlyDependOnLibsWithTags: ["type:contract"] },
  { sourceTag: "type:tooling", onlyDependOnLibsWithTags: ["*"] },
];
const nxBoundaries = (allow: string[] = []): Linter.RuleEntry => [
  "error",
  {
    enforceBuildableLibDependency: true,
    allow,
    depConstraints: constraints,
  },
];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "apps/site/.out/**",
      "**/node_modules/**",
      "**/.nx/**",
      "**/storybook-static/**",
    ],
  },
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  ...hooksEntries,
  {
    plugins: { "@nx": nxPlugin, labs: boundaries },
    rules: {
      "@nx/enforce-module-boundaries": nxBoundaries(),
      "labs/package-boundaries": "error",
      // Named scroll regions need a tab stop for keyboard scrolling.
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
  {
    files: ["**/*.config.ts", "**/.storybook/main.ts"],
    rules: {
      "@nx/enforce-module-boundaries": nxBoundaries([
        "@labs/tools/*",
        "@labs/release-tools/*",
      ]),
    },
  },
  {
    files: [
      "packages/{agent-stream,undo-machine,reorder-desk,ui-catalog}/src/**/*.ts",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "navigator",
        "localStorage",
        "sessionStorage",
        "process",
        "fetch",
        "setTimeout",
        "setInterval",
      ],
    },
  },
);
