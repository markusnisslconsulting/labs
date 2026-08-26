# Labs

Running companions to the articles on
[markusnissl.com/blog](https://www.markusnissl.com/blog), hosted at
[labs.markusnissl.com](https://labs.markusnissl.com). Each lab is the
exact code an article prints: the state machine you read about is the
state machine that runs.

| Lab                                                                    | Article                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [The transcript versus the row](https://labs.markusnissl.com/chat-box) | [The Chat Box Is a Log](https://www.markusnissl.com/blog/the-chat-box-is-a-log)                             |
| [A page-registered tool](https://labs.markusnissl.com/webmcp)          | [Declare Your Product's Verbs](https://www.markusnissl.com/blog/webmcp-the-page-as-a-tool-surface)          |
| [Seven APIs, checked live](https://labs.markusnissl.com/on-device-ai)  | [On-Device AI in Chrome: What You Can Ship Today](https://www.markusnissl.com/blog/chrome-built-in-ai-apis) |

## The design system (`@labs/ui`)

A token-driven component library on
[Base UI](https://base-ui.com) headless parts.

### Token hierarchy

Three tiers, each with one job — components bind only to the upper
two:

- **Primitive** — raw values, no opinion: palette, radii, spacing
  scale, typography scale (sizes, weights, line heights, font
  families). Defined in `styles/tokens/primitive.css`.
- **Semantic** — intent: `--uix-text-primary`, `--uix-bg-page`,
  `--uix-accent`, `--uix-status-*`, `--uix-density`. **This is the
  layer a product overrides** — dark mode and the density switch are
  both just semantic remaps (`data-theme="dark"`,
  `data-density="compact"`), and a second brand is one more override
  block. Two real brands ship: the consulting practice as the default,
  and `data-brand="coaching"` re-pointing colour, shape, type, elevation
  and density from one file.
- **Component** — per-part bindings: `--uix-button-accent-bg`,
  `--uix-chip-active-bg`, `--uix-panel-radius`. What a product themes
  on one component without touching any other.

The machine-readable registry (`src/tokens.registry.ts`) mirrors the
CSS one-to-one; a parity test fails the build when they drift, so
code generators and AI assistants consume the registry instead of
parsing stylesheets.

### Components

23 components, in two groups:

- **System primitives** — `Button` (variant × tone × size matrix),
  `Checkbox`, `Switch`, `RadioGroup`, `TextField`, `Select`,
  `NumberField`, `Combobox`, `Slider`, `Switch`, `Tabs`, `Accordion`,
  `Dialog`/`AlertDialog`, `Popover`, `Menu`, `Tooltip`, `Toaster`,
  `Progress Bar`, `Spinner`, `Skeleton`, `Badge`, `Avatar`,
  `StatusPill`, `Chip`, `Divider`, `Breadcrumb`, `Pagination`,
  `IconButton`, `Card` (compound slots), `Panel` (compound slots).
- **Product compositions** — the lab demos live with their labs in
  `apps/site/src/labs/<slug>/`, built FROM the primitives. The
  Storybook workbench documents the system; the labs site hosts the
  products.

### Headless foundation

Interactive components sit on
[`@base-ui-components/react`](https://base-ui.com) — focus
management, roving tabindex, ARIA wiring and tooltip positioning come
from its tested parts; this system owns tokens and styling via
Base UI's `data-*` state attributes.

Native platform elements stay where they win: `Button`,
`RadioGroup` (fieldset/legend), `TextField`, `Select`,
`Breadcrumb`, `Pagination` — the platform widget is the best
accessibility there. Two adoptions are deferred with documented
reasons: Slider and Combobox (Base UI rc error #62 in test
environments; revisited at 1.0).

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
  Findings block deploys. The suite runs twice, light and dark: a
  light-only run is how a black-on-dark select, a tooltip trigger on the
  browser's grey button face and a nested brand stuck on its light accent
  all shipped.
- **Cross-cutting gates:** `ui:browser-test` is a Playwright suite for
  the things no single story can assert — every docs page renders, the
  control scale holds across density and root font size, nothing
  overflows a 360px viewport, a high contrast theme still distinguishes
  selected from unselected, `auto` follows the system, and the print
  sheet out-ranks the components.
- **Visual regression:** Chromatic on every push and PR
  (Turbosnap builds only changed stories; findings reviewable in the
  Chromatic app). A local Playwright screenshot gate
  (`nx run ui:visual-test`) covers pre-release checks without a
  service dependency.

## Nx workspace

```
apps/
  site/                 composition shell + lab registry
    src/labs/<slug>/    one folder per lab: manifest + demo
packages/
  ui/                   @labs/ui design system + Storybook
  undo-machine/         write lifecycle state machine
  agent-stream/         typed event run
  reorder-desk/         desk state + tool descriptor
scripts/                browser API probes (Nx project)
```

Nx features in use: `@nx/vite` target inference, task pipeline with
`^build` dependencies, named inputs, local caching, affected-based
CI, module boundaries via scope tags, `nx release` configuration for
the packages.

## Commands

```sh
pnpm install
pnpm nx serve site            # dev server on :4300
pnpm nx storybook ui          # component workbench on :4400
pnpm nx graph                 # dependency graph

pnpm nx affected -t lint      # only what changed against main
pnpm nx run-many -t test      # everything with tests

pnpm format                   # prettier over the workspace
```

## Adding a lab

The registry scans `apps/site/src/labs/*/lab.tsx` at build time:

1. Create the folder, export a `LabMeta` manifest (title, summary,
   explanation, tags, article link, source link, optional demo).
2. Logic first: behaviour worth pinning becomes a package under
   `packages/` with its own tests.
3. The demo composes `@labs/ui` primitives; add a colocated story if
   the demo has a system-relevant component.

## Deployment

Pushes to `main` build everything and deploy the site over FTPS to
labs.markusnissl.com (the Storybook workbench ships to
`/storybook/`). The `.htaccess` disables mod_pagespeed, redirects
directory entries to their trailing slash, and routes unknown paths
to the SPA shell.

## License

[MIT](./LICENSE)
