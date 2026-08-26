# scripts

Everything here is wired to an Nx target or a package script. That is the
rule, and it is worth stating because it was not true: eighteen files
lived here from past debugging sessions — `debug-switch-deep.mjs`,
`shoot-cards.mjs`, `verify-switch-final.mjs` — each named after a bug that
was fixed months ago, several pointing at story ids that no longer exist.
Nothing referenced any of them, so nothing noticed when they rotted, and
the five scripts that matter were buried among them.

| Path                   | Target                                      | What it does                                                      |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `check-size.mjs`       | `pnpm size-check`                           | Bundle budget for the global CSS floor and the entry chunks       |
| `tokens/contrast.ts`   | `ui:contrast-check` / `-report`             | Every declared pairing, every theme, every brand, against WCAG AA |
| `tokens/usage.ts`      | `ui:tokens-check` / `-report` / `-baseline` | Reachability over the alias graph, plus the deprecation ratchet   |
| `stories/coverage.ts`  | `ui:story-coverage` / `-report`             | Story coverage derived from each component's own types            |
| `stories/snapshots.ts` | `ui:snapshot-budget` / `-report` / `-write` | Snapshot estimate against a committed ceiling                     |

Two exceptions, and they say so in their own docstrings: `probe.ts` and
`probe-flags.ts` report which built-in browser AI APIs a stock Chrome
profile exposes. They are run by hand because their answer depends on the
machine, and their output is the subject of a lab rather than a gate.

A new script that is not in the table above and is not one of those two
does not belong here. Put it in the lab it serves, or make it a target.
