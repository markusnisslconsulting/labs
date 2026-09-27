# Validated catalog manifests

Status: accepted

Keep automatic feature discovery from ADR 0003, with `lab.json` data manifests instead of executable metadata modules. The site and build tools discover the same files under `src/labs/*` and `src/patterns/*`; no central entry list is maintained.

Each manifest owns its localized content, kind, route slug, related resources, execution requirements, scenario IDs and component references. English is required and supplies the fallback. Resources may be empty. A renderer identifies either a lazy demo module or a Storybook entry and view type.

The site build validates metadata, route uniqueness, source-module default exports, component references and the built Storybook index. Invalid metadata fails the build. Development validates source metadata and renderer files without requiring a Storybook rebuild on every edit. The schema stays in build tooling; the client imports its types and receives plain data. Release route generation and browser route cases use the same validated catalog loader.

Changing a published slug requires an explicit route migration. Scenario metadata describes operations the demo already exposes; selectable scenario URLs are a separate feature contract.
