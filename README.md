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

## Architecture

An Nx monorepo on pnpm workspaces, arranged so that logic and views
cannot blur:

```
apps/
  site/                 composition shell + the lab registry
    src/labs/<slug>/    one folder per lab: manifest, demo, links
packages/
  ui/                   @labs/ui — demo components, stories, tokens;
                        Storybook instance and hosted workbench
  undo-machine/         @labs/undo-machine — write lifecycle, vitest
  agent-stream/         @labs/agent-stream — typed event run, vitest
  reorder-desk/         @labs/reorder-desk — desk state + tool descriptor
scripts/
  probe.ts              browser API probes behind the WebMCP article
  probe-flags.ts        same probe with Chrome's feature flags enabled
```

The layering is enforced, not aspirational. Every project carries a
`scope` tag, and `@nx/enforce-module-boundaries` fails lint when an app
imports into a package's internals or a package reaches across scopes.
The dependency graph matches the articles' own argument: views are
thin, every behaviour lives in a small tested package.

```
site ──▶ ui ──▶ undo-machine
          ui ──▶ agent-stream
          ui ──▶ reorder-desk
```

## Nx usage

- **Inferred targets.** `@nx/vite/plugin` infers `build`, `serve` and
  `test` for the app from its Vite config; packages declare explicit,
  cached targets.
- **Task pipeline.** `typecheck`, `build` and `build-storybook` depend
  on `^build`: change the state machine and every consumer rebuilds in
  order before anything else runs.
- **Named inputs.** Stories, tests and Storybook config are excluded
  from production inputs, so shipping code does not invalidate caches
  because a story moved a pixel.
- **Affected CI.** Pull requests run only what changed, against the
  merge base (`fetch-depth: 0`).
- **Module boundaries.** Scope tags plus the boundary rule keep the
  graph acyclic by construction.
- **Storybook per library.** `pnpm nx storybook ui` serves the
  components in isolation; `build-storybook` is a cached target like
  any other.

## The design system

`@labs/ui` is layered like a real system, because the demos deserve the
same discipline as a product:

```
styles/
  tokens.css        colour, focus ring, radius — no component names
  base.css          element defaults shared by site and Storybook
  primitives.css    Button, Chip, StatusPill, Panel (.uix-*)
  surfaces.css      demo-table/pane/note classes the articles print
components/
  Button.tsx        native button, four variants, focus-visible ring
  Chip.tsx          static tag or filter button with aria-pressed
  StatusPill.tsx    tone dot hidden from AT; the words carry the state
  Panel.tsx         named landmark per live example
```

The demos compose these primitives; nothing in a demo hand-rolls its
own button styles.

## Testing

- **Unit:** vitest over every logic package (`nx run-many -t test`).
- **Stories as tests:** play functions assert semantics — a disabled
  button keeps its accessible name, a filter chip toggles
  `aria-pressed`, a panel resolves as a named region.
- **A11y as a gate:** the a11y addon checks every story with
  `a11y: { test: "error" }`, so an axe finding fails the story, and
  `pnpm nx run ui:test-storybook` replays all of them headless against
  the built Storybook in CI. Findings block deploys; they never ship
  as warnings.
- **Foundations documented:** colour tokens render as swatches with
  their computed contrast ratios against paper; keyboard focus is
  asserted by a play function that tabs through real controls.

## Commands

```sh
pnpm install
pnpm nx serve site            # dev server on :4300
pnpm nx storybook ui          # component workbench on :4400
pnpm nx graph                 # the dependency graph

pnpm nx affected -t lint      # only what changed against main
pnpm nx run-many -t test      # everything with tests
pnpm nx run-many -t build     # everything buildable

pnpm format                   # prettier over the workspace
```

## Adding a lab

The registry scans `apps/site/src/labs/*/lab.tsx` at build time, so a
lab registers itself by existing:

1. Create `apps/site/src/labs/<slug>/lab.tsx` exporting a `LabMeta`:
   title, summary, explanation paragraphs, tags, article link, GitHub
   source link, and optionally a live demo component.
2. Logic first: if the demo has behaviour worth pinning, that behaviour
   becomes a package under `packages/` with its own tests; the view in
   `@labs/ui` stays thin.
3. Add a colocated story so the component appears in the workbench.

The overview, search, tag filter, lab page and footer all read from
the registry. Lab hundred costs what lab one cost.

## Deployment

Pushes to `main` build everything and deploy the site over FTPS to
labs.markusnissl.com. The `.htaccess` shipped with the app disables
mod_pagespeed (the host otherwise recombines scripts into two copies
of React) and routes unknown paths to the SPA shell.

## License

[MIT](./LICENSE)
