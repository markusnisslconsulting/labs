# 0008 — Autodocs with rich TSDoc, not an MDX page per component

Status: accepted (2026-08)

## Context

The question was whether every component should get a handwritten MDX page
instead of the generated autodocs, so that more description is possible.

The objection behind it is fair: an autodocs page consists of a props table
and stories, so it explains _what_ a component can do, but not when to
reach for it and when not to.

The first attempt was one MDX file per component. It was abandoned, and not
out of convenience. An MDX page is a second source alongside the code: it
does not know the props, so somebody copies them out, and copied props go
stale. That had already happened twice here — three theming tables still
named `--uix-radius-m` after the shape roles had landed, and nobody noticed
until a test went looking.

## Decision

**Autodocs stays, and the component's TSDoc carries the content.**
Everything an MDX page would say lives in the comment above the function and
is lifted by docgen into the generated page:

- One sentence of **Use it for / Reach for something else when**, so that
  the choice between two similar components is on the page and not in a
  comparison document.
- An **Accessibility** section saying what the component guarantees itself
  and what the caller owes.
- A **Theming** section with the table of override slots.
- Where needed, **Performance** and a note on rejected alternatives.

**The slot table is checked against the registry.** The test in
`packages/ui/test/tokens.spec.ts` requires both directions: every component
token appears in a table, and every default printed there is the value from
the registry. The table is therefore handwritten but no longer wrong by
transcription.

**Free prose gets its own pages, not component pages.** The guides
(theming, accessibility, contributing, deprecation) and the foundations are
MDX, because they have no props that could go stale.

## Consequences

The price is that a long explanation lives in a comment and Markdown has to
be maintained inside TSDoc — including the trap that made Components/Button
unusable for days: an `<a href />` without backticks is turned by Markdown
into a real anchor, and Storybook's link renderer calls `href.startsWith`.
That is why `ui:browser-test` loads each of the forty docs pages and
requires it to render.

The gain is that there is no second source. Whoever changes the props
changes the documentation in the same diff, and whoever does not change them
cannot forget it.

## Rejected

- **MDX per component.** A second source, goes stale, see above.
- **A handwritten props table.** The same problem, only smaller.
- **Autodocs alone with no TSDoc prose.** That was the starting state, and
  the pages said nothing about when to reach for the component.
