# @labs/ui-mcp

The design system, as something a model can ask questions of.

Stage 12 of `docs/roadmap.md` is "readable by an agent". Its first half is
`packages/ui/inventory.json` — forty-nine components with their props, their
compound parts and the sentences saying when to reach for something else,
generated from source with a gate that fails when it drifts. This is the
second half: the same data, answerable by question rather than by reading a
file.

## Why it exists

An agent writing against this library has two questions, and a props table
answers neither.

**Which component do I reach for?** Answered by the `insteadWhen` sentences,
which exist precisely to send somebody elsewhere. `find_component` ranks on
them: ask it for "let someone pick several suppliers from a long list" and it
answers `Combobox`, because that component's own sentence says "a list too
long to scan" and "hold more than one answer".

**What does it promise?** Answered by the accessibility line and the keyboard
map — the two things a component is held to and the two an implementation
gets wrong quietly.

## The constraint

**This server may not know anything the repository does not already check.**
Every answer comes from a file with a gate behind it:

| Answer            | Source                               | Gate              |
| ----------------- | ------------------------------------ | ----------------- |
| Components, props | `packages/ui/inventory.json`         | `ui:inventory`    |
| Keyboard contract | `packages/ui/src/keyboard.map.ts`    | its coverage test |
| Tokens            | `packages/ui/src/tokens.registry.ts` | `ui:tokens-check` |
| API surface       | `packages/ui/api-surface.md`         | `ui:api-surface`  |

So there is no second source to go stale, and nothing here is a claim
somebody has to remember to update. Two of the four are read with a regex
rather than imported, because importing them would mean this server needs a
TypeScript build to name a colour — and a regex over a file whose shape
changes returns _fewer_ rows rather than an error. `test/data.spec.ts` counts
what it parsed against the imported source for exactly that reason, and both
earlier versions of the token parser needed it: one produced
`--uix-semantic-accent` for a property called `--uix-accent`, and the next
stopped inside a font stack's escaped quote and returned 151 of 154.

## Running it

```sh
pnpm nx run ui-mcp:serve
```

It speaks MCP over stdio. To wire it into Claude Code from this checkout:

```sh
claude mcp add labs-ui -- node --experimental-strip-types \
  "$PWD/packages/ui-mcp/src/server.ts"
```

The paths inside the server are resolved from its own location, so it answers
about whichever checkout it was started from.

## What it offers

- `list_components` — every component with its status and what it is for
- `describe_component` — props with types and docs, parts, slots, the
  accessibility promise, the keyboard contract
- `find_component` — search what each is for and when not to use it
- `list_tokens` — filter by name or by tier, because the tier _is_ the rule
  (ADR 0002: components bind to semantic and component tokens, never to
  primitive values)
- `labs-ui://api-surface` — every exported signature with the prose stripped
