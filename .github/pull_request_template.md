## What changed, and why

<!-- The mechanism, not the diff. A reviewer can read the diff. -->

## How it was verified

<!-- Name the gate. "Tests pass" is not a verification; "ui:browser-test
     narrow.spec fails without this" is. If a gate was added, say what
     broke when you removed the fix on purpose. -->

## Blast radius

- [ ] Touches `packages/ui/src/styles/` or `tokens.registry.ts` — every
      product's appearance changes with this
- [ ] Adds or changes a semantic token — this is an API change, and the
      Deprecation guide applies
- [ ] Changes a component's public props
- [ ] Changes the snapshot count (run `nx run ui:snapshot-budget`)
- [ ] None of the above

## Checklist

- [ ] The gates run locally: `pnpm nx run-many -t typecheck lint test build`
- [ ] Stories: reference stories do not mutate in `play()`
- [ ] A new state is visible in the story Chromatic photographs, not only
      in an interaction story
