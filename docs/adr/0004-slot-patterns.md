# 0004 — Two slot patterns, no type filtering

Status: accepted (2026-08)

## Context

Slots in React: prop slots, compound components in place, or
`React.Children` type filtering (`child.type === Title`).

## Decision

- **Prop slots** for small inline content whose styling the component owns
  (Button `leading`/`trailing`, TextField `prefix`/`suffix`).
- **Compound slots in place** for structural regions with their own layout
  (Card.Header/Body/Footer, Panel.Header/Body).

Rejected: type filtering. It breaks when a slot is wrapped, breaks with
duplicate copies of a package (a type is a function reference), and allows
no prop injection into the slot.
