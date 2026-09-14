Official A2UI v0.9.1 schemas, copied unchanged from commit `1c45c809b655878d06e3afc6dda22100afecc0a4` of https://github.com/a2ui-project/a2ui. Apache-2.0; see LICENSE.

Tests register a catalog alias under the v0_9 ID retained by these v0.9.1 schemas, as the upstream test runner does. The publicly served ticket catalog keeps its own ID.

The lab catalog is generated from its supported component shapes with the structural references required by A2UI. From the repository root, run `pnpm exec tsx apps/site/scripts/ticket-ui-catalog.ts`, then format `apps/site/public/catalogs/ticket-ui.json`.
