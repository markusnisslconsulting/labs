# Changelog

Per component, not per repository.

A breaking change to `Select` is a major version for everyone importing
`Select` and nothing at all for a team that does not. A single version
number for the whole library cannot express that, so every entry below
names the component it concerns and the level of the change.

Levels, in the sense a consumer cares about:

- **breaking** — existing code stops compiling or changes behaviour. Needs
  a codemod, or a written reason why one is impossible.
- **added** — new surface, safe to ignore.
- **fixed** — behaviour now matches what the documentation already
  claimed. Worth reading: a component that was announcing its state twice
  was not "working" before.
- **internal** — no change to `packages/ui/api-surface.md`.

`packages/ui/api-surface.md` is how you tell those apart without reading
the implementation: it holds every component's exported signatures with
the prose stripped, and `nx run ui:api-surface` fails when it drifts. If
that file changed, this one needs an entry.

## Unreleased

Nothing is published yet, so this section is the whole history. It will be
cut at the first release.

### fixed

- **Field** — compute `aria-describedby` from the error actually in force,
  not from the `error` prop. A form-supplied error rendered its message and
  set `aria-invalid` while `aria-describedby` pointed at nothing: visibly
  correct, silent to a screen reader, and invisible to every visual test.
  The same split, in `Checkbox`, `Switch` and `RadioGroup`, skipped the
  message wrapper entirely.
- **Form** — render the error summary once. Fields register in an effect,
  so on the first pass no error had an owner and every one took the branch
  meant for an error whose field the form does not render. The summary
  therefore rendered the messages with no field names, then replaced them
  with links. That subtree is `role="alert"`. Measured writes to it: **5
  before, 1 after** — four of them announcements of the same errors.
  `browser/announce.spec.ts` counts them now.
- **Tooltip** — set `role="tooltip"` on the popup and point the trigger's
  `aria-describedby` at it. Measured against Base UI `1.0.0-rc.0` the
  trigger had neither, so the hint reached no screen reader at all while
  the component's own docs said Base UI announced it.
- **Field, Checkbox, Switch, RadioGroup** — stop appending the word
  "required" to the label. `required` on the control is a programmatic
  state every reader announces, so the word made it say so twice: the
  computed accessible name came out `"Required required"`.
- **Slider** — hold the uncontrolled value. It put `defaultValue` on the
  input and displayed `defaultValue ?? min` for ever, so the number beside
  the thumb stopped being true the moment anyone moved it.
- **Dialog** — give the backdrop a box. It carried a colour and a
  `z-index` and no `position`, so it laid out at height 0 and every modal
  in the library opened over an undimmed page.
- **Menu** — style disabled items. The prop was accepted and changed
  nothing, so a disabled row was the same picture as an available one.
- **SegmentedControl, Switch** — use `--uix-bg-raised` for the selected
  segment and the thumb. `--uix-bg-surface` is the lightest surface role
  on light and not on dark, so both sank into their own track in the dark
  theme.
- **Banner** — change the fill per severity, not only a 4px edge. All four
  severities shared one background.
- **Alert** — put the dismiss control at the far edge rather than against
  the end of the title.
- **Pagination** — declare a width. `container-type: inline-size` means
  the width cannot come from the contents, so in a shrink-to-fit parent it
  collapsed to about 40px and rendered as four stacked lines.
- **Every field** — the built package shipped ten components whose
  stylesheet import pointed at a file the build never wrote. TextField had
  no stylesheet at all.

### added

- **Toolbar** — a row of controls that act on the same thing, with
  `role="toolbar"`, a name, and **one tab stop for the whole group**. That
  last part is the only reason to reach for this instead of a `div` with a
  gap: eight buttons in a row are eight tab stops on the way to the content
  below them, and arrow keys move between them instead. The roving ring is
  read from the DOM at each key press, not from a prop — one `SplitButton`
  contributes two controls, a conditional control comes and goes, and a
  disabled one has to drop out.
- **Stepper** — a fixed sequence with where-you-are and what-is-left. An
  ordered list inside a `nav` named by `label`, with `aria-current="step"` on
  the current item, because the visual position in a row of circles answers
  "where am I" for exactly one kind of reader. Each state is a fill **and** a
  word in a visually hidden span: colour alone is WCAG 1.4.1, and the mark
  inside a completed circle is `aria-hidden` so it cannot carry the meaning
  either. Finished steps become buttons when `onStepChange` is passed; steps
  ahead never do, because a control that looks available and then refuses is
  worse than one plainly not there yet.
- **Drawer** — a panel of detail or controls beside the thing it belongs to.
  Sides are logical (`inline-start`, `inline-end`, `block-end`), so a details
  panel lands on the side the reading ends on rather than a fixed edge of the
  screen. `modal` is the prop that matters: a filter panel is meant to be
  used _with_ the list beside it, and making that list inert defeats the
  panel. Non-modal draws no scrim, because a scrim over an operable page
  tells the reader the opposite of the truth and swallows the clicks it looks
  like it is inviting.
- **Dialog, AlertDialog, Field, `useFieldMessages`** — exported from the
  package root. They were reachable only as `@labs/ui/components/Dialog`;
  `import { Dialog } from "@labs/ui"` did not compile while every other
  component did. A gate now checks the barrel against the directory.
- **EmptyState** — the place where a list or table would be, when there is
  nothing to show. A polite `role="status"`, because the text usually
  appears _because of something the reader did_ and a result that renders
  silently leaves a screen reader user waiting. The heading is opt-in: a
  component that guessed `<h2>` would corrupt the heading outline of every
  page that put an empty state inside a card.
- **SplitButton** — one default action with variants behind an arrow. Two
  real buttons, not one button with two click regions, so both halves are
  reachable and each has its own name. `menuLabel` is required because the
  arrow is icon-only and "More" is useless on a page with three of them.
  `SplitButton.Item`/`.Separator`/`.Group` are `Menu`'s parts re-exported.
- **AvatarGroup** — the handful of people attached to one thing. The names
  of everyone past `max` are in the counter's own label, because "+3" tells
  a sighted reader there is more to see and tells a screen reader nothing.
  `person` renders a face yourself, for a presence dot or a link.
- **DataTable** — columns and rows as data, with sorting (`aria-sort` on the
  header cell, a real `<button>` inside it), selection keyed by row rather
  than by index so it survives a sort, `table-layout: fixed` column widths,
  a sticky header, and virtualisation. `Table` stays what it is: markup with
  styling, for a table you wrote yourself.

  Virtualising reports `aria-rowcount` for the whole set and each rendered
  row its true `aria-rowindex`. Without those, a windowed table announces
  the length of its window — "row 12 of 24" in a table of ten thousand,
  which is worse than not virtualising because it is confidently wrong.
  `browser/runtime.spec.ts` measures all of it, including that the sticky
  header does not move while the body scrolls.

- **Form** — the layer above the field. `Form` takes errors by field name,
  the shape a server returns them in, and each field finds its own: a
  caller cannot route an error to the wrong field or forget to route it.
  With `Form.Summary` (a `role="alert"` region whose links move focus to
  the control, not just the viewport), `Form.Actions`, `Form.Group` (a real
  fieldset and legend), a `busy` state, and `summaryOn` to choose between
  showing errors on submit and showing errors the form was handed.
  Native submission is prevented unless an `action` is set, because a form
  with nowhere to go reloads the page and loses what was typed.
- **Checkbox, Switch** — `name`, so a form can route an error to them.
  These three plus `RadioGroup` carry their own label and so do not go
  through `Field`, which is why they were the only fields in the library
  that could not receive a server error. "You must accept the terms" is
  the canonical form error and it had no home.
- **Field** — owns label, hint, error, required and the aria wiring, and
  hands back one object to spread. Before it, nine field components all
  took `label`, two took `hint`, one took `error` and none took
  `required`.
- **Select, Combobox, NumberField, Slider, SearchInput, Checkbox,
  RadioGroup, Switch** — `hint`, `error` and `required`.
- **Menu, Popover** — `open`, `defaultOpen`, `onOpenChange`, `side`,
  `align`. Both rendered their root with no props, so their open state was
  unreachable from outside.
- **NumberField, Slider** — `label` accepts a node again. It was typed
  `string` because the accessible name came from `aria-label`.
- **Chip** — `disabled`. The stylesheet had styled `:disabled` since the
  component existed while the type rejected the prop.

### breaking

Nothing yet; nothing is published. The first published version starts the
window in which this section matters.

### internal

- **Build cache** — `build-storybook` no longer uses the `production` input
  set, which excludes `*.stories.tsx`. A Storybook build is made of stories,
  so editing one left the cache warm: measured at `Cache: 1/1 hit (100%)`
  with the change never reaching `dist`. Four gates depend on that build and
  were therefore exercising the previous stories. `nx.json` has a `storybook`
  named input now, and `packages/ui/test/build.spec.ts` asserts both it and
  the deliberate exclusion on `build`.
- **Packaging** — `scripts/prepare-dist.mjs` now gives inferred type imports
  their extension too. It rewrote `from "./X"` and not `import("./X")`, which
  is the shape TypeScript emits for an inferred type — so a consumer on
  node16 module resolution got a declaration pointing at a module Node
  cannot resolve. Caught by `attw`.

- One focus contract in `base.css` replacing thirteen per-component rings
  and fourteen components with none.
- `disabled` expressed in colour rather than opacity across eleven
  components; `--uix-opacity-disabled` deprecated with a removal window.
- Shared stylesheets are their own build entries.
- Interaction tests carry `!dev`: 81 of 156 stories were tests shown as
  examples.
