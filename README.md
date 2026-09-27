# Labs

Running companions to the articles on
[markusnissl.com/blog](https://www.markusnissl.com/blog), hosted at
[labs.markusnissl.com](https://labs.markusnissl.com). The catalog contains
interactive article companions, reusable UI components and composition patterns.

| Lab                                                                    | Article                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [The transcript versus the row](https://labs.markusnissl.com/chat-box) | [The Chat Box Is a Log](https://www.markusnissl.com/blog/the-chat-box-is-a-log)                             |
| [A page-registered tool](https://labs.markusnissl.com/webmcp)          | [Declare Your Product's Verbs](https://www.markusnissl.com/blog/webmcp-the-page-as-a-tool-surface)          |
| [Seven APIs, checked live](https://labs.markusnissl.com/on-device-ai)  | [On-Device AI in Chrome: What You Can Ship Today](https://www.markusnissl.com/blog/chrome-built-in-ai-apis) |

## The design system (`@labs/ui`)

A token-driven component library on
[Base UI](https://base-ui.com) headless parts.

### Token hierarchy

Three tiers separate raw values, product intent and component overrides:

- **Primitive** — raw values, no opinion: palette, radii, spacing
  scale, typography scale (sizes, weights, line heights, font
  families). Defined in `packages/ui/src/styles/tokens/primitive.css`. Components may use
  spacing and font-size scales directly; colour, radius, typeface and shadow
  use semantic or component tokens.
- **Semantic** — intent: `--uix-text-primary`, `--uix-bg-page`,
  `--uix-accent`, `--uix-status-*`, `--uix-density`. **This is the
  layer a product overrides** — dark mode and the density switch are
  both just semantic remaps (`data-theme="dark"`,
  `data-density="compact"`), and a second brand is one more override
  block. The consulting palette is the default,
  and `data-brand="coaching"` remaps colour, shape, type, elevation
  and density from one file.
- **Component** — per-part bindings: `--uix-button-accent-bg`,
  `--uix-chip-active-bg`, `--uix-panel-radius`. What a product themes
  on one component without touching any other.

The machine-readable registry (`packages/ui/src/tokens.registry.ts`) mirrors the
CSS one-to-one; a parity test fails the build when they drift, so
code generators and AI assistants consume the registry instead of
parsing stylesheets.

### Components

The [generated inventory](packages/ui/inventory.json) records the current
components, props, compound parts, token slots and usage guidance. The site's
`/components` directory joins that inventory with the built Storybook index to
link each component to its Docs page and a visible example.

Lab demos live in `apps/site/src/labs/<slug>/`; reusable composition examples
live in `apps/site/src/patterns/<slug>/`. Both use the shared UI components.
The first pattern is a [FAQ composition](apps/site/src/patterns/faq/README.md).

### Brand assets

The site and workbench load local fonts and the consulting mapping from
[`@labs/brand`](packages/brand/README.md). Foundations / Brands compares consulting
and coaching with the same components. The package also supplies a versioned
artifact and Tailwind adapter for main-site adoption; the generic UI library
does not require consumers to load these fonts.

### Headless foundation

Interactive components sit on
[`@base-ui-components/react`](https://base-ui.com) — focus
management, roving tabindex, ARIA wiring and tooltip positioning come
from its tested parts; this system owns tokens and styling via
Base UI's `data-*` state attributes.

Native controls are used where their interaction fits the API: Button uses a
button, RadioGroup uses radio inputs and a fieldset, and Slider uses a range
input. Combobox currently uses an input with a datalist. Browser tests cover
selected interactions; native picker behavior and assistive-technology support
also need platform testing.

## Testing

- **Unit:** vitest over every logic package (`nx run-many -t test`),
  plus the token registry parity test.
- **Stories as tests:** play functions assert semantics — a disabled
  button keeps its accessible name, a filter chip toggles
  `aria-pressed`, tabs activate on Enter, an alert with a title is a
  named `alert` region.
- **A11y as a gate:** the a11y addon checks every story with
  `a11y: { test: "error" }`, and `pnpm nx run ui:test-storybook` replays
  every story in a real browser through `@storybook/addon-vitest`.
  Findings fail the test job. The suite runs in light and dark themes.
  Deployment consumes the release artifact retained by successful main CI;
  see [release tooling](tooling/release/README.md).
- **Cross-cutting gates:** `ui:browser-test` is a Playwright suite for
  the things no single story can assert — every docs page renders, the
  control scale holds across density and root font size, nothing
  overflows a 360px viewport, a high contrast theme still distinguishes
  selected from unselected, `auto` follows the system, and the print
  sheet out-ranks the components.
- **Visual regression:** affected UI changes run Chromatic on main pushes and
  pull requests. Each component opts one matrix story into snapshots; Docs
  pages are excluded by the project default. Findings are reviewed in Chromatic.
  A local Playwright screenshot gate
  (`nx run ui:visual-test`) covers pre-release checks without a
  service dependency.

## Nx workspace

```
apps/
  site/                 composition shell + lab registry
    src/labs/<slug>/    one folder per lab: manifest + demo
    src/patterns/<slug>/ composed pattern + fixture content + manifest
  ui-mcp/               component inventory tools
packages/
  brand/                local fonts, logos and consumer brand mappings
  ui/                   @labs/ui design system + Storybook
  ui-catalog/           shared inventory validation contract
  undo-machine/         write lifecycle state machine
  agent-stream/         typed event run
  reorder-desk/         desk state + tool descriptor
tooling/
  build/                shared Vite plugins and package measurements
  checks/               workspace, token, API and size checks
  release/              artifact assembly, verification and preview
  fixtures/             isolated consuming applications
  visual/               screenshot checks and visual sweeps
tests/release/          assembled artifact browser tests
```

Nx features in use: `@nx/vite` target inference, task pipeline with
`^build` dependencies, named inputs, local caching, affected-based
CI, module boundaries via scope tags, `nx release` configuration for
the packages.

## Commands

```sh
pnpm install
pnpm dev                      # dev server on :4300
pnpm nx run ui:storybook       # component workbench on :4400
pnpm nx graph                 # dependency graph

pnpm nx affected -t lint      # only what changed against main
pnpm nx run-many -t test      # everything with tests

pnpm gates                    # shared local/CI target list
pnpm nx run ui:visual-sweep    # captures for visual inspection
pnpm format                   # prettier over the workspace
```

## Combined preview

`pnpm dev` starts the site at `http://localhost:4300` and mounts a built
Storybook at `/storybook/`. It builds Storybook before starting. After editing
stories, rebuild with `pnpm nx run ui:build-storybook` and refresh the frame;
`pnpm nx run ui:storybook` remains available for Storybook's own live development.

`pnpm preview` builds and assembles both surfaces, then serves the result at
`http://127.0.0.1:4620`. The public artifact is `dist/release/public`; its file
hashes, routes, source commit and local-change marker are in
`dist/release/manifest.json`. The preview checks those hashes before serving.

The site build prerenders the catalog, lab descriptions and missing-page view.
Titles, descriptions, canonical/social metadata and the sitemap come from the
catalog. Interactive demos load after hydration. The build-only server renderer
stays in `apps/site/.out/prerender` and is excluded from the public release.

`pnpm nx run release-tests:browser-test` checks catalog routes, the nested
workbench, example navigation, script/style content and missing responses.
`site:a11y` runs its journeys against the same assembled artifact.
See [release tooling](tooling/release/README.md) for the routing policy and
verification limits.

## Adding a lab

The catalog discovers `apps/site/src/labs/*/lab.json` and
`apps/site/src/patterns/*/lab.json`. A manifest contains a stable slug,
entry kind, localized title/summary/explanation, tags, optional resources,
requirements, scenarios and related component names. English (`en`) is
required; missing locale translations fall back to English.

1. Add a manifest alongside the feature. Use an existing entry as an example;
   `apps/site/src/catalog/schema.ts` defines the contract. An article is optional.
2. Point its renderer at a `LabDemo.tsx` default export or a Storybook ID and
   view type. Compose screens from shared components and named patterns.
3. Keep feature logic local. Extract a package when another consumer needs its
   contract or behavior.
4. Run `pnpm nx run site:catalog-check`. It builds Storybook and validates
   route uniqueness, resources, scenario requirements, demo exports, component
   references and real Storybook destinations. The site build depends on it.

Vite also validates manifests during development. Schema and filesystem checks
run in the build tools; the browser receives data and lazy demo imports.

## Site shell and navigation

The application shell lives in `apps/site/src/shell`; routed views live in
`pages`, and feature state stays with each demo. Compose pages from shared
components and reusable patterns.

Catalog search, tag and execution filters are shareable URL parameters. Filter
edits replace the current history entry; opening an example keeps a return
link to that filtered catalog. Browser Back restores the focused card and
scroll position within the mounted application.

The overview links to `/demos`, `/components`, `/patterns` and `/foundations`.
Demos and patterns use the manifest catalog. Components use inventory metadata
and offer search and status filters; Foundations discovers available foundation
and guide pages from Storybook. Reference links open the full-size workbench.
All four directories are prerendered and included in the sitemap. Search matches
public slugs as well as titles, summaries and tags.

`SiteStringsProvider` owns shell labels and message formatters. Its locale also
selects manifest translations, with English as the fallback. English is the
only shipped shell locale. A new locale also needs the component library's
`LabsStrings` and each demo's string provider configured.

## Deployment

Successful main CI runs retain a tested release archive. Deployment consumes that
exact archive over FTPS; it uploads versioned assets and route documents before
replacing entry files and generated Apache rules. The workbench lives at
`/storybook/`. Unknown document routes and missing assets return HTTP 404.
See the [release runbook](tooling/release/README.md) for smoke checks, retained
assets and artifact-based rollback.

## License

[MIT](./LICENSE)
