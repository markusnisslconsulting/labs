# Contributing to Labs

## Setup

```sh
pnpm install
pnpm nx serve site        # labs.markusnissl.com locally (:4300)
pnpm nx storybook ui      # Workbench (:4400)
```

## What belongs where

| Content                  | Place                                                       |
| ------------------------ | ----------------------------------------------------------- |
| Design system components | `packages/ui/src/components/`                               |
| Tokens                   | `packages/ui/src/styles/tokens/` + `src/tokens.registry.ts` |
| Product demos            | `apps/site/src/labs/<slug>/` (demo + manifest)              |
| Logic with tests         | `packages/<name>` (their own Nx projects)                   |

Two boundaries are enforced: apps import only through package entry
points, and component tokens live on the part's own docs page — not in
Foundations.

## The way in

An RFC first, then code. The form under _Issues → Propose a component_ asks
five questions, and two of them are the actual point: **who else needs it**
and **what it replaces**.

A component exactly one product needs belongs in that product. That is not
a refusal. A design system that takes in every request becomes a collection
of special cases nobody uses twice — and the way back is open as soon as a
second product wants it.

What an RFC does not need: finished code, a Figma file, an estimate.

## The bar

What "reviewed" means, in order — technical first, because that is cheap to
check, and then what only a person can see.

1. **`pnpm gates` is green.** Seventeen Nx targets, the bundle budget and
   the changelog gate — everything CI gates on. No
   review starts before that; it is not a ritual, it saves both sides a
   round trip.
2. **Looked at.** `nx run ui:visual-sweep` renders every visible story in
   two engines. Both rendering faults that last reached Markus were
   engine-specific and invisible in exactly the engine the pipeline used. A
   gate that checks a DOM property is not a substitute for looking.
3. **The axes hold.** Do the props generalise, or is the component still
   carrying a product detail?
4. **The contract is in the docs.** "Use it for" and "reach for something
   else when", the accessibility line, and what the caller still owes.
   `ui:inventory` checks the sentences are there.
5. **Who reviews.** Today one maintainer, see `CODEOWNERS`. That is a
   single person and therefore this system's bottleneck — it does not grow
   past what one person can carry. It is written here because it is a
   property of the system and not an oversight.

## Response times

Predictability is why a team uses a system instead of forking it. So
commitments rather than intentions:

| What                   | First reply    | Decision                                  |
| ---------------------- | -------------- | ----------------------------------------- |
| Bug blocking a product | 1 working day  | as fast as possible, workaround if needed |
| Bug, otherwise         | 3 working days | slotted into the next cycle               |
| Pull request           | 3 working days | 2 weeks                                   |
| Component RFC          | 1 week         | 2 weeks, yes/no/later with a reason       |

"First reply" means read and triaged, not solved. A reply saying "this will
take until March" is worth more than silence.

The roadmap is in `docs/roadmap.md` and names, per stage, what stands and
what does not.

## Contributing components

1. **Check Base UI first:** interactive components sit on
   [`@base-ui-components/react`](https://base-ui.com) parts (focus
   management, ARIA, keyboard). Native platform elements stay where the
   widget itself is the best accessibility (Button, RadioGroup, TextField,
   Select, Breadcrumb, Pagination). Deviations get an ADR (`docs/adr/`).
2. **Props, not use-case variants:** axes that generalise (`variant`,
   `tone`, `size`), not one-off variants.
3. **Slots by rule:** prop slots for small inline content the component has
   to style (`leading`, `prefix`); compound slots in place for structural
   regions (`Card.Header`). Never filter on `child.type`.
4. **Tokens at three tiers:** components bind to semantic or component
   tokens, never to primitive values. The parity test
   (`test/tokens.spec.ts`) blocks drift.
5. **Stories that claim something:** every component gets stories for all
   its states; plays assert semantics (roles, attributes), not pixels. Axe
   findings fail (`a11y: { test: "error" }`).

## Gates before every push

```sh
pnpm gates                        # exactly the targets CI runs
pnpm nx run ui:visual-test        # locally, against committed baselines
pnpm nx run ui:visual-sweep       # contact sheets to look at, not a gate
```

`pnpm gates` lives in package.json and covers both gating steps in
`.github/workflows/ci.yml` — the Nx targets and the bundle budget. The list
used to be written here as well, maintained in two places, and three targets
were missing here — `package-check`, `tokens-dtcg` and `adoption`.
`tokens-dtcg` is exactly the one that then fell over in CI after everything
was green locally: new tokens with no regenerated DTCG export.

The same shape recurred with the bundle budget, which CI ran as its own step
and `pnpm gates` did not run at all. So a change that made every field
component 2.44 KB gzip heavier passed locally and failed in CI, and the
number that mattered was the one only CI saw. `size-check` is part of
`pnpm gates` now. The rule behind both: if CI checks it, this command runs
it — one list, or it is not a list.

CI runs affected; axe and test findings block deploys.

## Releases

`pnpm nx release --dry-run` for a preview, `pnpm nx release` for the
packages' version and changelog (configured in `nx.json`).

## Decisions

Architecture decisions are recorded as short ADRs: `docs/adr/` — number,
status, context, decision, consequences. The large directions (Base UI as
the headless foundation, token tiers, the labs registry) each have one.
