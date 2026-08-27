# 0011 — Charts: a library and a token contract, not components

Status: accepted (2026-08)

## Context

The roadmap has said since it was written that charts are "a decision, not
components". This records the decision.

The pressure to build them is real. A chart drawn with the system's own
tokens looks like the system; a chart from a library looks like the library
unless somebody makes it match. So the tempting move is a `<BarChart>` of our
own, and that is the move to refuse.

A charting layer is a second design system. It has its own scales, its own
layout algorithm, its own accessibility problem, its own set of chart types
that will never be finished, and its own tail of "can it do a stacked area
with a log axis and a broken scale". Thirty-seven components took this repo
a long time; charts alone are comparable, and nothing about them is specific
to this organisation.

## Decision

**A library renders; this system owns the vocabulary.** What ships from here
is not chart components but the three things that make somebody else's chart
look and behave like ours:

1. **A categorical token ramp.** Series colours, in order, with a documented
   rule for what happens past the end of it. Today the palette has status
   colours and one accent; a series ramp is a different job — its members
   have to be distinguishable from each other rather than meaningful on
   their own, and it has to hold at eight series and in both themes.
2. **Chart-shaped semantic tokens.** Grid line, axis line, axis label, plot
   background, annotation. Every library has a theme object; the work is
   naming ours once so the theme object is a mapping and not a set of
   opinions typed into a config.
3. **The non-visual contract**, which is where library defaults are worst: a
   chart needs a text alternative, a table equivalent for the same data, and
   focusable data points where they are interactive. That belongs in this
   repository's documentation because it is the same contract every other
   component here is held to.

**Which library is chosen when a product needs one, against these criteria,
in this order.** Naming a winner today would be inventing a measurement:

- **It renders SVG or Canvas that we can style with our tokens**, rather than
  painting from a JavaScript theme object we would have to keep in sync with
  the CSS. A library whose colours are only reachable from JS breaks the
  rebranding story, because a brand override here is a CSS custom property on
  the root and nothing more.
- **It works with React Server Components**, or is honest about needing a
  client boundary. This library marks eleven components `"use client"`
  deliberately and gates both directions; a charting dependency that drags
  the whole page into the client bundle is a cost paid by every route.
- **Its accessibility story is a starting point rather than a rewrite.**
  Roles on the marks, a way to supply a text alternative, keyboard access to
  data points.
- **Its bundle cost is measurable per chart type.** `scripts/component-size.mjs`
  measures per component here; a charting dependency that is all-or-nothing
  cannot be held to that, and a page with one sparkline should not pay for
  the whole grammar.
- **It is maintained by more than one person**, because a chart library is
  where a design system's dependency risk concentrates.

## Consequences

- Nothing is added to the inventory. `packages/ui` stays a component library
  and does not grow a charting surface it would have to keep.
- The token work is real work and is not blocked on picking a library: the
  ramp and the chart-shaped roles can be defined, contrast-checked in both
  themes and exported through DTCG before any library is chosen, and they are
  what makes the eventual choice a mapping exercise.
- A product that needs a chart before that work is done adds the library
  itself and takes the mismatch. That is the honest state, and it is better
  than a half-built chart component that looks like ours and behaves like
  neither.

## Rejected

- **Building charts here.** A second design system, as above.
- **Wrapping a library in our own components** so consumers never see it.
  The wrapper has to expose the library's full surface eventually or it
  becomes the thing people work around, and then there are two APIs to learn
  instead of one. A theme plus documentation is the smaller commitment and
  the one that survives a change of library.
- **Naming the library in this ADR.** The criteria are the durable part; a
  name chosen without a product to measure against would be a preference
  dressed as a decision, and this file would then be quoted as though it had
  been.
