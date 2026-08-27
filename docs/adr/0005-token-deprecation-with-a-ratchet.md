# 0005 — Token deprecation as data, enforced with a ratchet

Status: accepted (2026-08)

## Context

Tokens are a public API. As soon as more than one team consumes them, the
two most common questions are: "is anyone still using this, can I delete
it?" and "we deprecated that months ago — are new uses still appearing?"

Both are usually answered with grep, and grep answers wrongly. Tokens alias
one another: a primitive with no direct reference in any component
stylesheet is very much alive if a semantic token aliases it. Usage is
**transitive**.

## Decision

**Deprecation is a field, not a comment.** `TokenDescriptor.deprecated`
carries the reason and the replacement, mirrored onto DTCG `$deprecated`.
Tools can read it; a comment in the CSS cannot be read.

**Usage is computed as reachability, not as a text search.**
`scripts/tokens/usage.ts` builds the alias graph (an edge means "A
references B in its own value"), takes as roots everything referenced from
component CSS, element defaults, product code or a theme/brand block, and
computes the closure. Whatever is unreachable from every root is dead.

**Enforcement is a ratchet, not a ban.** A baseline file records how many
uses of a deprecated token are tolerated. The check fails when the number
**rises** — and equally when it has fallen without the baseline being
updated. Existing uses block nobody, new ones do not get through, and
progress cannot roll back.

## Consequences

- A team migrates at its own pace; the system loses no ground meanwhile.
- "Unused internally" does not mean "safe to delete": a consuming product
  can hold references this repository cannot see. The report says so
  explicitly. The path is deprecate, wait, then remove.
- The graph finds typos as a side effect: a `var(--uix-text-primry)` is
  covered by no declaration and turns the check red.
- Cost: a baseline file in the repo that has to be written along with every
  deliberate change (`nx run ui:tokens-baseline`).
