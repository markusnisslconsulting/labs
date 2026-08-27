# 0007 — Reference shows, interaction acts; coverage follows the type

Status: accepted (2026-08)

## Context

Button had nine stories, Banner had one, and no rule said which number was
right. "More stories" is not a standard, it is a mood.

Plus one concrete bug: Chromatic photographs the frame **after** `play()`.
Ten stories mutated in `play()` and therefore captured the state after the
interaction as the baseline — under a name that promised the initial state.
`Switch/Off` clicked its own label, so the off switch was on the moment
anybody looked. `Alert/Dismissible` dismissed itself and therefore looked
broken.

## Decision

**Reference stories do not mutate.** They show a state and at most check it.
They are the documentation and the Chromatic baseline.

**Interactions are stories of their own** and forgo snapshots
(`chromatic.disableSnapshot`). Exceptions with a reason are allowed: `Focus`
and `Dialog` keep their snapshots, because the focus ring and the open
dialog are precisely the picture a baseline should hold.

**Coverage is derived from the type signature, not negotiated.**
`scripts/stories/coverage.ts` requires:

1. Every value of every union prop is rendered by some story, and every
   state boolean is `true` somewhere. A state nobody can see is a state
   nobody checks, and Chromatic cannot hold it as a baseline.
2. At least one assertion per component. A story with no `expect` is a
   picture; here stories are meant to be checks as well.
3. If the component is operable, a story drives it from the keyboard.

Exceptions live in `EXCEPTIONS` with a reason, so that an exemption is a
decision in the repository and not a silence.

## Consequences

- On switching it on: 32 violations. Among them **33 of 34 components with
  no keyboard test**, while the documentation claimed keyboard operation.
- Values the component sets as its own default count as shown; otherwise the
  rule would demand a story that changes nothing.
- The rule grows with the type: a new `variant` demands its story on the day
  it is introduced, not at the next audit.
