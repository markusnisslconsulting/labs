# Writing UI in this repository

Rules an assistant needs before writing a component or a screen, and the
gate that enforces each. Every line here is checkable; where it is not, it
says so.

The inventory of what exists — 49 components, their props, their compound
parts, their override slots, and the sentence saying when to reach for
something else — is generated at `packages/ui/inventory.json`. Read that
first. It is regenerated from source and `nx run ui:inventory` fails when
it has drifted, so it is not a description of the library, it is the
library.

## Do not write CSS values

Every colour, radius, typeface, shadow, spacing and control height comes
from a token. A component may not name a primitive colour, radius,
typeface or shadow — those four are what a theme or a brand remaps, so a
component naming one puts itself permanently out of their reach.

```css
/* no */
.thing {
  background: #b31234;
  border-radius: 6px;
}
/* yes */
.thing {
  background: var(--uix-accent);
  border-radius: var(--uix-radius-control);
}
```

Spacing and font size may be used directly from the scale; they are a
shared rhythm rather than an identity.

_Enforced by_ `packages/ui/test/tokens.spec.ts` — no primitive in any
component stylesheet, no px radius, and every registered slot used with
its registered default.

## Layer everything

```css
@layer components {
  .uix-thing { … }
}
```

The layer order is declared once in `styles.css`. A rule outside a layer
beats every rule inside one, whatever its specificity, so an unlayered
declaration in a component is a rule a product cannot override.

_Enforced by_ the layer assertion in the build, which fails if the
`@layer` declaration is lost during minification.

## Three token tiers, and only one of them is yours to add to

- **primitive** — raw values. Never referenced from a component.
- **semantic** — intent: `--uix-accent`, `--uix-radius-control`,
  `--uix-font-body`. The only layer a brand touches, and a deliberately
  closed vocabulary. Adding one is an API change, not a convenience.
- **component** — per-part override slots, written inline with their
  semantic default: `var(--uix-button-accent-bg, var(--uix-accent))`. Add
  these freely; they cost nothing until a product fills one.

Two roles exist for relationships rather than for places, and both were
added because their absence shipped a bug:

- `--uix-bg-raised` is lighter than the surface behind it **in both
  themes**. `--uix-bg-surface` is not — it is the lightest of the three
  surface roles on light and not on dark, so a chip filled with it rose on
  one theme and sank on the other.
- `--uix-scrim` always darkens. `--uix-ink` and `--uix-paper` flip with
  the theme by design and may only be used inside `color-mix()`, for
  shading a fill. Naming one directly gave a modal a near-white scrim in
  dark mode.

## State conventions

- The value triple is `value` / `defaultValue` / `onValueChange`, and its
  siblings are `checked` / `defaultChecked` / `onCheckedChange` and
  `open` / `defaultOpen` / `onOpenChange`. All three, or none.
- **A component that offers an uncontrolled mode holds that state.**
  Slider did not: it put `defaultValue` on the input and displayed
  `defaultValue ?? min` for ever, so the number beside the thumb stopped
  being true the moment anyone dragged it.
- `disabled` is a colour, never an opacity: `--uix-text-disabled`,
  `--uix-bg-disabled`, `--uix-border-disabled`. An opacity cannot be
  measured against a background, and eleven components using one made a
  disabled button identical to a loading one.
- `required` is a state on the control, not a word in the label. The
  asterisk is `aria-hidden` decoration; `required` on the control is what
  a screen reader announces. Doing both makes a reader say it twice.

_Enforced by_ `packages/ui/test/api.spec.ts` and
`packages/ui/test/tokens.spec.ts`.

## Fields go through Field

Nine components take a label, a hint, an error and a required state.
`Field` owns the wiring and hands back one object to spread:

```tsx
<Field label={label} hint={hint} error={error} required={required}>
  {({ control, invalid }) => (
    <div className="uix-field-row" data-invalid={invalid}>
      <input {...control} className="uix-field-input" />
    </div>
  )}
</Field>
```

Spread `control`. Do not assemble the four by hand — Field's own worked
example did, forgot `required`, and rendered an asterisk over a control
that was not programmatically required.

A choice control that is its own label — a checkbox, a switch, a radio
group — uses `useFieldMessages` instead, because Field's layout does not
fit it.

## Never compile in a user-facing string

Not in an `aria-label`, not between tags. Every string a person reads or
hears comes from `useStrings()`, so a product serving a second market can
change it. Popover shipped an English "Close" button for as long as it
existed, because the gate only read attributes.

_Enforced by_ two rules in `packages/ui/test/api.spec.ts`, one for
attributes and one for text between tags.

## Interaction tests are not examples

A story with a `play` function carries `tags: ["!dev"]` — out of the
sidebar, still in the test run. Otherwise the catalogue fills with
components showing their resting state three times over, which is what 81
of 156 stories used to do.

Exactly one story per component sets `chromatic: { disableSnapshot: false }`.
That story is the matrix: every state in one frame.

_Enforced by_ `packages/ui/test/stories.spec.ts` and
`ui:snapshot-budget`.

## What a keyboard must do

`packages/ui/src/keyboard.map.ts` lists every key each component handles,
with a test per row in `browser/keyboard.spec.ts`. A component that
documents a key and has no row there fails the build.

Native behaviour — arrows on a radio group, Space on a checkbox, Home on a
range — is the platform's, and the claim is narrower: that nothing here
took it away. CSS can. Those rows need trusted key events, so they run in
Playwright rather than in a play function; `userEvent.keyboard` moves a
range input's label and never its thumb.

## Accessibility beyond axe

axe runs on every story in both themes and finds a minority of real
problems. Three things go further and are worth reaching for when adding a
component:

- `toHaveAccessibleName` / `toHaveAccessibleDescription` — the string a
  reader speaks for a node.
- `ariaSnapshot()` — the tree a reader walks, in order.
- `packages/ui/src/audit/wcag.ts` — all 55 Level A and AA criteria with
  what checks each, and `packages/ui/src/audit/screen-readers.ts` with
  the manual matrix.

## One component costs one component

Component CSS ships in the component's chunk. A page that never imports
Menu never downloads `Menu.css`. Shared stylesheets are their own build
entries, so each is emitted once under its own name — without that, ten
components shipped a stylesheet import pointing at a file the build never
wrote.

_Enforced by_ `scripts/consumer/check.mjs`, which builds two real
applications and compares what Rollup kept, and
`scripts/component-size.mjs`, a size ratchet per component.

## Before pushing

```sh
pnpm gates                    # exactly what CI runs
pnpm nx run ui:visual-sweep    # contact sheets, for looking at
```

`pnpm gates` and the Gates step in `.github/workflows/ci.yml` name the
same target list. They used to be two lists and the one here was missing
three targets, which is how a failure was first seen in CI.
