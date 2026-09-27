# 0003 — The labs registry via glob rather than a central list

Status: amended by [0014](0014-validated-catalog.md) (2026-09-22)

## Context

A central import list for labs scales badly: the hundredth lab costs a
change to a growing file, merge conflicts included.

## Decision

`import.meta.glob` scans `apps/site/src/labs/*/lab.tsx` at build time. A
lab registers itself by existing; the manifest (LabMeta) carries title,
summary, explanation, tags, article and source links, and optionally the
demo.

## Consequences

- The overview, search, tag filter and routing all read from the registry —
  the hundredth lab costs what the first one did.
- Typos in a manifest surface at build time (it is typed).
- Order follows the folder names; curating happens through names rather
  than through a list.
