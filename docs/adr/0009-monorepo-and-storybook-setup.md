# 0009 — Setup: one Storybook, three kinds of test, boundaries as a lint rule

Status: accepted (2026-08)

## Context

This repo is meant to show how a design system is set up with Nx and
Storybook when you mean it. The aim is not completeness but that every
decision has a reason you could defend in a review — and that the decisions
which turned out wrong are documented with their reason.

## One Storybook, not one per package

`packages/ui` is the only package with stories, and that is not
convenience: the other packages are logic with no surface. A Storybook per
package costs a build, a Chromatic project slot and its own address per
package, and the gain would be zero while there is nothing to show.

**When to switch:** as soon as product teams have components of their own
that they do not hand to the design system. Then Storybook composition
(`refs`): each team builds its own, the design system's Storybook embeds
them. Not one shared Storybook with globs over other packages — that makes
one team's build a blocker for everyone else.

## Three kinds of test, and the boundary between them

The split is by **runtime environment**, not by kind of test, because that
is the boundary you need to know while debugging.

| Target              | Runs in             | Checks                                                                                                                               |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ui:test`           | Node, Vitest        | What is on disk: token parity, the registry, CSS rules, stories as text                                                              |
| `ui:test-storybook` | Browser, Vitest     | Every story: `play()`, semantics, axe — twice, light and dark                                                                        |
| `ui:browser-test`   | Browser, Playwright | What no single story can claim: docs pages, control scale across density and text size, 360px, forced colours, the theme axis, print |

`ui:test` pays for no browser, because it reads files. `ui:browser-test` is
Playwright rather than the Storybook addon, because it has to emulate media
— `forcedColors`, `colorScheme`, `media: print`, viewport — and because its
cases are not stories.

**Story tests run through `@storybook/addon-vitest`.** The former
`@storybook/test-runner` is deprecated and said so on every run. The move
was faster (145 tests in 3.5s rather than 6.2s) and immediately surfaced a
failure the old runner had swallowed, because it did not read the browser
console.

**The suite runs twice, light and dark.** A light-only run let three
dark-mode faults through. Implemented through an env variable in
`initialGlobals` rather than a second Vitest configuration: custom
`setupFiles` disable the addon's automatic annotation provisioning.

## Boundaries are a lint rule, not an agreement

`@nx/enforce-module-boundaries` with two axes. `scope` answers "whose code
may I use", `type` answers "which layer am I in".

    type:app      -> type:feature, type:ui
    type:feature  -> type:ui
    type:ui       -> nothing

`scope` alone was not enough: `packages/ui` and `packages/reorder-desk` are
both `scope:shared`, so a button could have reached into a product screen. A
design system that depends on a product is no longer one.

## What is in `nx.json`, and why

- **`namedInputs.production`** excludes tests and stories, so a story change
  does not invalidate the library build cache. The bundle does not contain
  stories, so it should not be rebuilt for them.
- **`namedInputs.storybook`** is the same set _with_ stories, and
  `build-storybook` uses it. Reusing `production` there was a real defect
  and it lasted a long time: a Storybook build is made of stories, so
  excluding them from its inputs meant editing a story left the cache warm.
  Measured, with one word changed in a story and a warm cache — `production`
  inputs gave `Cache: 1/1 hit (100%)` and the word never reached `dist`;
  `storybook` inputs gave `Cache: 0/1 hit` and it did.

  The stale bundle was not the cost. Four gates depend on that build —
  `browser-test`, `visual-test`, `visual-sweep`, `visual-axes` — so each was
  testing the previous set of stories and reporting success about a build
  nobody had made. It surfaced as a habit of passing `--skip-nx-cache` to
  make a change visible, which is what working around a wrong cache looks
  like from the inside. `packages/ui/test/build.spec.ts` asserts both halves
  now, because the two targets have to differ and a one-sided rule invites
  somebody to make them the same.

- **A cached target declares every file its tests read.** The general form of
  the above, and it took a third instance to see it. `ui:test` reads
  `AGENTS.md`, `CONTRIBUTING.md` and `docs/roadmap.md` — its citation checker
  is entirely about them — and declared none: `default` covers
  `{projectRoot}/**` and `sharedGlobals` three files at the root, and a
  document two directories away is in neither. Measured: with those
  undeclared, adding a citation of a file that does not exist and running
  `nx run ui:test` reported "188 passed" from the cache. CI ran cold and
  caught it, which is the only reason it was seen.

  Writing the rule found a fourth: `build.spec.ts` reads `nx.json`, so the
  gate about cache inputs was itself replayable when the cache configuration
  changed.

  The check reads every path-shaped string literal in the specs rather than
  the arguments of `readFileSync`. That is deliberate — the three documents
  are passed to `it.each` as a list and read through a variable, so a scan of
  literal read calls finds `nx.json` and misses exactly the three that
  mattered.

- **Every project declares lint and typecheck.** `nx run-many -t lint` runs
  the target for the projects that have it and says nothing about the ones
  that do not, so a package can arrive unlinted and the run stays green.
  `ui-mcp` did: added without a lint target, it carried two
  `@nx/enforce-module-boundaries` errors through three green CI runs, and one
  was real — its tests reached into `../../ui/src`, a dependency on another
  package's file layout rather than on its published surface. The rule that
  exists to catch exactly that had never been pointed at the file.

  Fixing it moved `KEYBOARD_MAP` into the barrel, where it belongs beside
  `allTokens` for the same reason, and made the dependency explicit in
  `package.json`. `test` stays exemptible with a stated reason, because a
  project can legitimately have nothing to unit-test and cannot legitimately
  be unchecked.

- **`targetDefaults.*.dependsOn: ["^build"]`** — typecheck and Storybook
  need the built dependencies, not their sources.
- **`cache: true` everywhere except `serve` and `storybook`.** A gate
  without a cache gets switched off in CI as soon as it hurts.
- **CI runs `nx affected`** against `defaultBase: main`, with
  `fetch-depth: 0`, because a shallow clone has no base.

## Versioning yes, publishing no

All four packages are `private: true` and are at the same time listed in
`nx.release.projects`. That looked like a contradiction and is a decision:
`nx release` produces versions and changelogs here so that a consumer in the
workspace knows what changed, and publishes nothing. A design system
consumed only inside one monorepo needs no registry, but very much needs a
version history.

The package's shape is checked anyway, and that is the part that paid off.
The workspace `exports` point at TypeScript sources — correct for a
monorepo, because Vite compiles them and HMR works — and
`publishConfig.exports` describes the built shape. `ui:package-check` builds
a real manifest from that in `dist` and runs publint and attw against it.

On the first run publint reported four errors nobody had noticed:
`./styles.css` and `./tokens/*` were in the exports map and were never
built, and `./tokens.registry` had no entry of its own. A consumer of the
published form would have got no token layer at all. attw then found that
every component `.d.ts` contained an `import "./Button.css"` pointing at
nothing, and that the declarations write relative imports without an
extension — which a bundler resolves and Node's ESM resolver does not. npm
would have published all of it without complaint.

## What we deliberately did not do

- **Nx Agents / distributed execution.** At this size the setup costs more
  than the whole CI run. It pays off from about ten minutes of runtime.
- **A Storybook per package.** See above.
- **Enforced commitlint / conventional commits.** `nx release` can build
  changelogs from them, but an enforced prefix is no substitute for a commit
  message that explains the mechanism. The convention here is prose with
  measurements.
- **Pre-commit hooks for the full gate list.** The browser gates need a
  build; that belongs in CI and not between `git commit` and lunch. Format
  and lint would be defensible.
- **Storyshots.** Chromatic does that, and a snapshot in the repo is a diff
  nobody reads.

## Consequences

Three Playwright configurations (`packages/ui` for the library, `apps/site`
for the site, `visual/` for the local screenshots) is one more than would be
pleasant. They stay separate because they start different servers and need
different base URLs; one shared configuration with three projects would be
the next step if a fourth appears.
