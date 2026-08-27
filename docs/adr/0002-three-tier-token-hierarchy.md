# 0002 — Three-tier token hierarchy with registry parity

Status: accepted (2026-08)

## Context

Tokens without layers lead to hardcoded values in components and products
that cannot be rebranded. Tokens without a machine-readable registration
are useless to generators and to AI assistants.

## Decision

Three tiers: **primitive** (raw values), **semantic** (intent; the
rebranding and dark-mode layer), **component** (bindings per part).
Components bind only to semantic or component tokens. The CSS definitions
are mirrored one-to-one in `src/tokens.registry.ts`; a parity test blocks
drift and enforces the alias direction (component → semantic → primitive).

## Consequences

- Every new token needs a CSS declaration and a registry entry (the test
  requires both).
- Rebranding, dark mode and density are override blocks on the semantic
  layer — not forks.
- The parity test ignores override blocks
  (`[data-theme|density|brand]`), because the registry documents the light
  values.
