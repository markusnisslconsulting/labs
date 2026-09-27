# Repository checks

These commands run from the workspace root. Nx project names remain stable when their implementation paths move.

| Check                               | Command                              |
| ----------------------------------- | ------------------------------------ |
| Source ownership and test discovery | `pnpm nx run scripts:quality-graph`  |
| Component inventory                 | `pnpm nx run ui:inventory`           |
| Public API surface                  | `pnpm nx run ui:api-surface`         |
| Token use and deprecation           | `pnpm nx run ui:tokens-check`        |
| Token interchange format            | `pnpm nx run ui:tokens-dtcg`         |
| Color contrast                      | `pnpm nx run ui:contrast-check`      |
| Story state coverage                | `pnpm nx run ui:story-coverage`      |
| Snapshot budget                     | `pnpm nx run ui:snapshot-budget`     |
| UI adoption                         | `pnpm nx run ui:adoption`            |
| Bundle and component sizes          | `pnpm size-check`                    |
| Isolated package consumption        | `pnpm nx run consumer-fixtures:test` |
| Changelog requirement               | `pnpm changelog-gate`                |

`eslint-boundaries.ts` is loaded by the root ESLint configuration. Tests for these checks run through `scripts:test`. Build plugins belong to `tooling/build`; browser capture tooling belongs to `tooling/visual`; independent consumer applications belong to `tooling/fixtures/consumers`.

The browser capability probes are owned by the site: `site:probe-ai` and `site:probe-ai-flags`. They report the installed browser's capabilities and are manual checks, not CI compatibility results.
