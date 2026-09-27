# 0016 — CI comparison and gates

Status: accepted

## Context

A push may contain several commits. Comparing only `HEAD~1` misses changes
earlier in that push. A missing comparison base must not produce a passing
changelog check. Independently maintained local and CI command lists can drift.

## Decision

`tooling/checks/ci-range.ts` resolves one comparison for both Nx and the
changelog check. It reads the event JSON without interpolating its fields into
shell commands and checks that the checkout matches the workflow SHA.

| Event                           | Comparison                                           | Project selection                                                              |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| Normal push                     | Event `before` to tested `after`                     | Full workspace in CI; range available to Chromatic                             |
| Pull request                    | Merge base of event base SHA and tested merge commit | Affected projects                                                              |
| New ref                         | Empty tree to tested commit                          | Full workspace                                                                 |
| Force push or rewritten history | Before/after trees, when both are available          | Full workspace                                                                 |
| Manual workflow                 | Explicit `base` input to tested commit               | Full workspace                                                                 |
| Missing history                 | Unavailable                                          | Full workspace; changelog fails until history is fetched or a base is supplied |

These inputs follow GitHub's [push payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads#push)
and [pull request checkout semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).
Main runs the whole graph so cancelling an earlier run cannot leave its changes
unchecked in a later release. Manual runs also check the whole graph.

`pnpm gates` is the single entry point for formatting, the dependency
audit, Nx targets, build-backed bundle budgets and the changelog check. The audit
requires registry access and fails on high/critical advisories or request errors. `pnpm gates --affected` selects affected
projects when the workflow comparison is valid. Full-graph fallbacks remain full.
The changelog check establishes only that both files changed; reviewers assess
the entry's accuracy and compatibility impact.

Local runs include tracked working-tree edits and untracked files. The default
base is the branch's merge base with local `main`; on main it is the previous
commit. A repository's initial commit compares with an empty tree. Set `NX_BASE`
to choose a different local base, or pass a base to `pnpm changelog-gate`.

All workflows use `.github/actions/setup` for `.nvmrc`, the package-manager
version and frozen installation. Chromatic uses the same comparison resolver;
an Nx failure fails its job instead of being interpreted as an unaffected UI.

## Verification

Temporary Git repositories exercise multi-commit pushes, tested PR merges,
force pushes, initial commits, unavailable and shallow history, manual inputs,
checkout mismatches and local edits. The multi-commit case invokes Nx against a
three-project fixture and checks that both changed projects are selected.

## Limits

The weekly full dependency report is separate; production audit also runs inside
`pnpm gates`. Deployment's dependency on
successful gates and an exact tested artifact is a separate release concern.
Shared setup alone does not establish that dependency.
