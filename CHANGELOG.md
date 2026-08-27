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

- **Combobox, CommandPalette, DataTable, DatePicker, Drawer, EmptyState,
  FileUpload, InlineEdit, Select, Stepper, TagInput, Textarea, Tree** — 28
  `color` declarations were being dropped by the browser, so those elements
  inherited instead of taking the colour they asked for.

  `--uix-text-body`, `--uix-text-heading`, `--uix-text-caption` and
  `--uix-text-ui` are **font sizes**. The colour family is
  `--uix-text-primary`, `--uix-text-secondary`, `--uix-text-disabled` and
  `--uix-text-on-accent`. Two families under one prefix, and the size family
  reads like a colour, so `color: var(--uix-text-caption)` is a line anyone
  would write. It is also `color: 0.75rem`, which is not a colour, and CSS
  drops the whole declaration in silence — no browser warning, nothing in
  the build.

  Visible where the colour carried meaning. DatePicker's out-of-month days
  were meant to be dimmer than the month's own and measured identical, so a
  calendar of August showed the last five days of July in August's ink.
  Elsewhere the token happened to resolve to the colour the element
  inherited anyway, and those declarations now say what was always
  rendered.

  `tokens.spec.ts` refuses a colour property naming a non-colour token, and
  the registry knows every token's type, so it is exact rather than a guess
  at names.

- **Textarea** — it had no border and no background. `uix-field-input` is
  deliberately `border: none; background: transparent`, because every field
  here draws its frame on the `uix-field-row` wrapper, and this component put
  that class on the control with no row around it. It rendered as text on the
  page with a resize handle floating at the corner. `data-invalid` sat on an
  element no rule selects, so the error state never showed either.

  Nothing caught it: the accessibility tests, the interaction tests and the
  whole audit suite passed on a control with no border. A screenshot caught
  it. `browser/runtime.spec.ts` now asserts the computed border and
  background, and that an invalid textarea's border differs from a valid
  one's.

- **FileUpload** — the remove button rendered on a line of its own below the
  progress bar. The row is a three-column grid and the bar spans `1 / -1`, so
  it opens a second row; the button, being the last child with no placement,
  was auto-flowed after it into row three. Every cell is placed explicitly
  now, and a test asserts the name, the size and the button share a line.

- **Stepper** — a comment claimed a connector line that nothing drew. It has
  one vertically, where the circles are stacked and the line has a column to
  itself. Horizontally there is still none, and now there is a reason
  written down: the labels sit beside their circles on exactly the centre
  line a connector would occupy, so drawing one struck every label through.

- **AvatarGroup** — the overflow counter overlaps the faces again. The
  overlap was `.item + .item` and the component rendered every visually
  hidden name after every avatar, so a run of spans sat between the last face
  and the counter, the adjacent-sibling selector matched nothing, and the
  counter lost its negative margin. Each person is one element now, holding
  the face and that person's name, and the rule is `:not(:first-child)`.
  Found in a screenshot; `browser/runtime.spec.ts` measures the geometry now.
- **Select** — the popup is drawn by this system where
  `appearance: base-select` is supported: our surface, our radius, our accent
  on the highlighted row, one chevron rather than two. Behind `@supports`, so
  everywhere else is unchanged and the element stays a real `<select>`. Its
  width still cannot be set — measured against Chromium 151, author sizing on
  `::picker(select)` is ignored while background and border apply — so
  `Combobox` remains the answer when the popup's geometry matters.
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

- **Card** — `Card.Media`, a banner image slot, and
  `--uix-card-media-ratio` to theme it. The slot sizes the box rather than
  the picture, because a grid of cards whose images keep their own ratios
  starts every title at a different height. `ratio` overrides it per card,
  and the docstring says what that costs: the crop is real, and a portrait
  in a 16:9 box loses its top and bottom.

- **CommandPalette** — `hints`, the key legend along the bottom, on by
  default and showing the three keys the palette binds. It is `aria-hidden`:
  the field is a combobox, so a screen reader already announces the arrows
  and Enter, and reading the legend aloud would put three sentences in front
  of the reader every time it opens. `hints={null}` removes it, a node
  replaces it.

- **Strings** — `paletteNavigate`, `paletteSelect`, `paletteClose` and
  `paletteEscKey`. The last one is a key cap and not a sentence, and it is
  here because "Esc" is "Echap" on a French keyboard.

- **Textarea** — text longer than a line. `resize` is left to the browser:
  `resize: none` is the most common line in a textarea's stylesheet and it
  removes the one control the platform gives somebody whose text does not fit
  the box, which is WCAG 1.4.4 dressed as a design decision. `autoGrow` is
  opt-in and capped, and the character counter is announced only in the last
  fifth — a live region beside a field being typed into reads the number over
  the letters otherwise.
- **DatePicker** — a text input with a calendar beside it, not a calendar
  alone: typing is faster for anyone who knows the date, and a month grid is
  thirty-five stops to reach one day. Dates are `YYYY-MM-DD` strings, never
  `Date` objects — `new Date("2026-08-27")` is midnight UTC, which is the 26th
  in Los Angeles, so a date entered in Berlin reads a day early in California
  for some users and not others. The week starts where `Intl` says the locale
  starts it (`de-DE` Monday, `en-US` Sunday), the grid is one tab stop with
  arrows that page the month by themselves, and refused days are shown and
  struck through rather than removed.
- **Combobox** — async options through `onQueryChange` (which turns local
  filtering off, because filtering an answer a server gave hides rows it
  deliberately returned), multiple selection with each held value removable
  by name, and an `option` render prop. Same combobox-over-listbox pattern as
  `CommandPalette`: focus stays in the field, `aria-activedescendant` reports
  the highlighted row.
- **CommandPalette** — reaching any action by typing. A `combobox` over a
  `listbox` inside a modal dialog, and **focus stays in the text field**
  while `aria-activedescendant` reports the highlighted row: moving DOM focus
  onto each row as the arrows walk it would take focus out of the input, and
  the next letter typed would go nowhere. The result count is announced when
  the _count_ changes rather than when the query does, so typing eight
  characters that match the same three rows announces once. A disabled
  command is shown and announced as disabled rather than filtered out — one
  that vanishes when it cannot be used is one the reader concludes does not
  exist.
- **Tree** — a hierarchy the reader navigates, as `role="tree"` with one tab
  stop for the whole thing: a hundred-node tree is one stop rather than a
  hundred, and the stop sits on the selected row so leaving and returning
  does not send anyone back to the top. Arrows do the work, including the two
  that carry the structure — right opens a closed branch and then steps into
  an open one, left closes an open branch and then steps out to the parent.
  `aria-level`, `aria-setsize` and `aria-posinset` are on every item, because
  a flat list of `treeitem`s conveys none of that on its own.
- **FileUpload** — choosing files to send somewhere, with the result of each
  one visible. The drop zone is a `<label>` wrapping a real
  `<input type="file">`, not a div with a drop handler: a div can be dropped
  on and cannot be reached, focused or activated from a keyboard, and there
  is nothing to add back that a browser has not already done better. Drag and
  drop is the enhancement. Each `<progress>` names its own file, because "68
  per cent" says nothing when three are in flight — and progress is
  deliberately _not_ announced, since a live region that fires on every
  percentage point is a reader nobody can use.
- **InlineEdit** — one value in a dense layout, usually read and
  occasionally changed. The reading state is a `<button>`, not a div with a
  click handler and not a flat text field: a button says "this does
  something" and is reachable with Tab, while a flat input says "type here"
  and swallows the arrow keys of anyone navigating past it. The switch
  between the two announces through a `role="status"`, because replacing a
  button with a text field changes what the control _is_. Escape restores,
  Enter commits, and a refused change keeps the reader in the editor.
- **TagInput** — a set of short free-text values the reader builds up. The
  tags are a list so a reader can count them, and each remove button carries
  the tag it removes in its accessible name: a column of buttons all called
  "Remove" is the usual failing of this pattern. Removing announces through a
  `role="status"`, because Backspace deletes something _elsewhere_ on the
  screen and a reader focused in the input would otherwise get nothing.
  Enter with a draft adds a tag and does not submit the surrounding form;
  Enter on an empty field is the form's again.
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

- **AvatarGroup, Combobox, DatePicker, TagInput, Tree** — the render prop is
  called `item` in all of them. It was `person`, `option`, `day`, `tag` and
  `node`, and `item` already on `CommandPalette` and `FileUpload`: seven
  names for one idea, so a consumer learned it seven times and guessed wrong
  six.

  Rename the prop, nothing else. The signature each one had is unchanged —
  `item` receives exactly what its old name did.

  No codemod, because nothing outside this repository used any of them: the
  labs site imports six components and none of these render props. A codemod
  for a prop with no callers is a file that has to be maintained to do
  nothing.

  Two render props kept their own names and the difference is real, not
  grandfathering. `Stepper`'s `marker` replaces the circle inside a step
  rather than the step, and called `item` it would promise the label and the
  connector too. `InlineEdit`'s `display` replaces the reading state, where
  there is no collection and so no item. `Field`'s function-as-children is a
  React idiom older than this library. `packages/ui/test/api.spec.ts` holds
  the list, ties each exception to the one component it was granted for, and
  fails on a name that is neither `item` nor listed.

- **Combobox** — replaced. It was an `<input list>` over a `datalist`, which
  is to say the operating system's own picker: honest, very small, and unable
  to express async options, multiple selection or custom rows. Those three
  are the reasons the component now does the work itself.

  What changes for a caller: `options` takes `ComboboxOption` descriptors as
  well as strings; `value` is `string | string[] | null` and is an array
  exactly when `multiple` is set; `Combobox.Option` is gone, because a
  `datalist`'s only legal child was an `<option>` and the list is no longer a
  `datalist` — pass descriptors, or the new `option` render prop. `Select`
  still covers the short-fixed-list case the `datalist` version was good at,
  and costs a fraction of this.

  Free to do now, and it will not be later: nothing in this workspace is
  published yet.

Nothing yet; nothing is published. The first published version starts the
window in which this section matters.

### internal

- **Build cache** — a gate's own implementation is now an input to it. Seven
  cached targets are implemented by a file in `scripts/` and none counted it:
  editing `scripts/stories/coverage.ts` so the check must fail still reported
  "Story coverage passed — 49 components" from the cache. A broken or
  weakened gate would have replayed its previous verdict until something else
  in the project changed.
- **Workspace configuration** — every project declares `lint` and
  `typecheck`, checked by a gate. `nx run-many` runs a target for the projects
  that have it and reports nothing about the ones that do not, so `ui-mcp`
  arrived unlinted and carried a real boundary violation through three green
  CI runs.
- **KEYBOARD_MAP** — exported from the package root, beside `allTokens`. Both
  are machine-readable contract data and a consumer had no way to reach the
  keyboard map except by importing another package's source file.
- **`@labs/ui-mcp`** — an MCP server over the inventory, the keyboard map, the
  token registry and the API surface. Four tools and one resource over stdio;
  it answers only from files that already have a gate behind them, which is
  the constraint rather than a convenience — there is no second source to go
  stale. Not part of `@labs/ui`; a separate private package.
- **Release process** — a change to `packages/ui/api-surface.md` now requires
  a `CHANGELOG.md` entry, enforced in CI against the same base `nx affected`
  uses. The surface file made "which component moved" a line in a diff; this
  is what makes somebody say what it meant.
- **Documentation** — the numbers documents state about countable things are
  checked. Four had gone stale in one session: `AGENTS.md` said 35 components
  when there were 49, the screen-reader matrix was described as 108 cells in
  two documents when it holds 147, and roadmap stage 12 still reported 37
  components with no prop count. The check fails both on a wrong number and
  on a sentence rewritten so the pattern stops matching — a check that has
  quietly stopped looking is not a lesser failure. Declared rather than
  inferred, because a rule over every number cannot tell a live claim from a
  measurement of a moment: ADR 0006's "30.4 kB for 33 components" has to stay
  exactly as written.
- **Build cache** — `ui:test` declares the workspace documents its citation
  and count checks read, and `nx.json`, which `build.spec.ts` reads. None
  were inputs, so editing any of them replayed the previous result — measured
  at "188 passed" from cache against a roadmap citing a file that does not
  exist. A gate now checks the class: every path-shaped literal in a cached
  test's specs has to be among that target's inputs.
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
