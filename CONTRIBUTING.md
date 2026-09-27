# Contributing to Labs

## Setup

Use the Node version in `.nvmrc` and the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev                         # site and built Storybook at localhost:4300
pnpm storybook                   # live component workbench at localhost:4400
```

The site mounts a built Storybook. Rebuild `ui:build-storybook` after editing
stories when using `pnpm dev`, or use the live workbench during component work.

## Ownership and boundaries

| Content                                      | Location                         |
| -------------------------------------------- | -------------------------------- |
| Shared components, tokens and stories        | `packages/ui/`                   |
| Demo content, manifests and feature state    | `apps/site/src/labs/<slug>/`     |
| Composed patterns and fixture content        | `apps/site/src/patterns/<slug>/` |
| Independently reusable logic                 | `packages/<name>/`               |
| Workspace build, check and release tools     | `tooling/`                       |
| Browser checks across the assembled surfaces | `tests/release/`                 |

Import packages through their declared entry points. Screens compose shared
components and reusable patterns; feature-specific state stays in the owning
application. See [package ownership](docs/adr/0012-package-ownership-and-environments.md)
and [screen composition](docs/adr/0013-screen-composition.md).

`CODEOWNERS` names the current maintainer. A code-owner entry requests review;
it does not itself prevent merging. Repository rules are configured separately
on GitHub. There is no guaranteed response or resolution time.

## Proposing a component

Use the component proposal issue form for additions to the shared library.
Describe the consumers, the interaction contract, and what existing composition
cannot provide. Keep application-specific components with their feature until
there is a reusable contract to share.

Before adding UI, read `packages/ui/inventory.json`. Prefer existing components,
slots and patterns. Interactive components use Base UI or native elements;
record a substantial departure in an ADR.

Component changes should include:

- Semantic/component token bindings and layered CSS.
- Documented props, states, slots, appropriate uses and limitations.
- Stories covering meaningful states, with interaction tests for behavior.
- Keyboard, accessible-name and description checks where relevant.
- A changelog entry for public API changes, including compatibility impact.

## Verification and review

```sh
pnpm gates
pnpm nx run ui:visual-sweep
```

`pnpm gates` runs formatting, the production dependency audit, the Nx targets declared in
`tooling/checks/gates.ts`, build-backed bundle budgets and the changelog check.
CI calls the same command: affected checks on pull requests, full checks on main
and manual runs. [ADR 0016](docs/adr/0016-ci-comparison-and-gates.md) defines the
comparison ranges, missing-history behavior and local `NX_BASE` override.

Inspect the visual sweep for component or layout changes. Automated DOM and axe
checks do not replace visual or assistive-technology review. Include the checks
run and any unverified behavior in the pull request.

Chromatic reports visual differences in a separate workflow. Its pull-request
job fails on unaccepted differences; main runs refresh the baseline. The weekly
full dependency report is separate. High/critical production findings also fail
`pnpm gates`; the audit requires registry access.

Successful main CI runs retain the verified release archive. Deployment selects
that successful run's exact artifact, validates its source SHA and file hashes,
and uploads through the existing FTPS pipeline. Promotion, recovery and rollback
are described in the [release runbook](tooling/release/README.md). A local gate
run does not deploy anything.

## Storybook controls and tests

`packages/ui/vitest.config.ts` declares the browser project used by both the
sidebar test runner and `ui:test-storybook`. The Nx target runs it once per
theme; `ui:test` keeps the filesystem and contract tests in Node.

Every exposed boolean control needs an explicit boolean in component or story
`args`. A state shown elsewhere in a matrix does not initialize that control.
Controlled checkbox, switch, chip and popup examples use the `booleanState`
decorator to synchronize interaction and Controls. Their initial-state props
remain in the read-only Docs table instead of competing with the controlled
value in Controls. Event callbacks stay documented under Events and are excluded
from Controls. Use explicit `fn()` callbacks in interaction stories.

The browser suite checks resolved Storybook args and exercises the manager's
controls, Code panel and Docs event table. Restart the live workbench after
changing manager features in `.storybook/main.ts`.

## Releases and decisions

`pnpm nx release --dry-run` previews the package version and changelog changes
configured in `nx.json`. Publishing and production deployment require separate
authorization.

Record substantial architectural decisions in `docs/adr/` with their context,
decision and consequences. Keep setup instructions and operational claims aligned
with the current commands and workflow dependencies.
