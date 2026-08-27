# The road to enterprise readiness

Twelve stages, each with where it stands today. A roadmap nobody can
predict gets forked, so what is written here is what stands, what does
not, and how each of those can be measured.

As of 2026-08-27. The order is impact, not effort.

| #   | Stage                                 | Standing |
| --- | ------------------------------------- | -------- |
| 01  | The component API contract            | stands   |
| 02  | Localisation                          | stands   |
| 03  | The inventory an enterprise app needs | stands   |
| 04  | Forms as a system                     | stands   |
| 05  | States and scale, first class         | stands   |
| 06  | Accessibility past the automated 40 % | half     |
| 07  | Distribution and the version contract | half     |
| 08  | ~~Design and code as one source~~     | struck   |
| 09  | Performance as a contract             | stands   |
| 10  | Governance and the human process      | half     |
| 11  | Observability from real products      | open     |
| 12  | Readable by an agent                  | stands   |

## 03 — The inventory (stands)

It was the largest open stage and the only one where sheer quantity was the
problem. Thirty-seven components were enough for a website and not for an
application; there are forty-nine now, and every name that was on this list
is built. What each one cost, in the order it was blocking a team:

**DataTable** — done. Sorting, column widths, selection, virtualisation,
sticky header. `Table` is markup with styling and stays that way; the two
are different jobs and both are worth having. Three findings from building
it are in this file's stage 03 notes below, because each one says something
about the gates rather than about the table.

**Command palette** — done, and it closes this list. Two bugs came out of
building it, both found by gates rather than by looking: `aria-controls`
pointed at a listbox that was replaced by an empty-state message, so the
combobox claimed `aria-expanded="true"` over an element that was not there
(axe called it an invalid attribute value, correctly); and Base UI focuses
the popup rather than the field, which for a component whose entire
interaction is typing means the first keystroke goes nowhere.

**Tree** — done. The keyboard works off a flattened list of visible rows
rather than a recursive walk, which is what makes ArrowDown from the last
child of a branch land on the next root — the case a recursive
implementation gets wrong. Both directions of ArrowRight and ArrowLeft are
break-verified.

Its stories also gave `test/locators.spec.ts` its first real catch: ten
`getByRole("treeitem", { name: … })` queries without `exact`, one of them
naming "Textiles" in a tree that also contains "Northwind Textiles". Not yet
ambiguous in that fixture, and it would have become so the moment a test
opened one more level.

**FileUpload** — done. The decision worth recording is that the drop zone is
a label over a file input rather than a div with a drop handler, so keyboard
reachability comes from the platform instead of being reimplemented. And the
input is cleared after every selection: a file input keeps its value, so
re-choosing the file that just failed would otherwise fire nothing, and
retrying a failed upload is the commonest thing a person does here.

**InlineEdit** — done, and the gate asking for a complete value /
defaultValue / onValueChange triple earned its place on it: implementing the
uncontrolled half surfaced that the reading state rendered the `value` prop
rather than the resolved value, so an uncontrolled inline edit displayed
nothing at all. Without the rule it would have shipped that way.

**TagInput** — done. It is also the third component to need a per-item
render prop as its composability door, after `AvatarGroup`'s `person` and
`Stepper`'s `marker`. That is a pattern now rather than three decisions: the
data shape is what gets submitted, and what an item _looks_ like is a
separate question the caller answers.

**Toolbar** — done. One tab stop for the group and arrows within it, which
is the whole reason it exists rather than a styled `div`. Building it cost a
third loose-selector bug, and that produced a gate: see below.

**Stepper** — done. Two decisions worth naming: the state of each step is in
text as well as in colour, and only finished steps are navigable. The second
is the whole navigation model — going back to a step you completed is safe,
jumping past one is usually not, and a stepper that made all four steps
buttons would put four tab stops in the page for two usable destinations.

**Drawer** — done. The one prop worth naming is `modal`, because a drawer is
the component where the answer is genuinely sometimes no: a filter panel
beside a list is meant to be used _with_ the list. Measured while building
it, with `useInertBackground` switched off: Base UI still leaves nothing
behind the popup inert in `1.0.0-rc.0`, so the claim recorded on `Dialog`
holds for this version and is not inherited.

**EmptyState, SplitButton, AvatarGroup** — done. Small, and each carries one
accessibility decision that is the reason it is a component rather than
markup: a polite live region for the empty state, two named buttons instead
of one for the split button, and an overflow counter whose label still names
the people the layout dropped.

**DatePicker** — done, and it was the most expensive as promised. The
decision that matters is not the calendar: it is that a date is a
`YYYY-MM-DD` string and never a `Date`. A `Date` is an instant with a
timezone and a calendar date is not, so the same value read in two places
is two different days — for some users, months after release.

Two behaviours are pinned rather than left to whoever reads the code next.
The month clamp is sticky: 31 August forward a month is 30 September, and
forward again is 30 October rather than a remembered 31st, because
remembering is hidden state and would mean PageDown twice then PageUp twice
does not return you where you started. And Home goes to the locale's own
first day of the week, which `Intl` knows and this component would otherwise
have to guess.

**A real Combobox** — done. It was an `<input list>` over a `datalist`, the
operating system's own picker: honest, very small, and unable to express the
three things that were asked of it. It now shares `CommandPalette`'s pattern
exactly, which is the point — the two are the same shape of problem, and a
library where two components solve it differently is one where one of them is
wrong.

Replacing it also retired a false claim nothing could see. `UNTESTABLE` in
`test/api.spec.ts` exempted `Combobox` from the keyboard map because "the
datalist picker is browser chrome", and that stopped being true the moment
the component did the work itself. An exemption is a claim, and no gate reads
one.

**Charts: a decision, not components** — made, in
`docs/adr/0011-charts-a-library-and-a-token-contract.md`. Nothing is added to
the inventory. What ships from here is the vocabulary: a categorical series
ramp, chart-shaped semantic tokens, and the non-visual contract. The library
is chosen against criteria when a product needs one — naming a winner today
would be a preference dressed as a decision.

The token half is real work and is not blocked on that choice: the ramp and
the roles can be defined, contrast-checked in both themes and exported
through DTCG first, which is what turns the eventual choice into a mapping
exercise rather than a set of opinions typed into a config.

### What DataTable cost, and what it found

Not a list of features. Three things it exposed, all of which were true
before it existed:

**Two print gates were measuring Storybook.** `browser/print.spec.ts` asked a bare
`thead` and a bare `tbody tr` for their computed style. Storybook puts its
own args table in the story's DOM, earlier and with a height of zero, so
both tests had been reporting on Storybook's table rather than on `Table`.
Measured: the first `tbody tr` on that page reads "propertyName". The rules
turned out to be correct — the tests simply were not testing them, which is
a different problem and a worse one.

**"Every row of the keyboard map has a test" did not check that.** It
counted rows and asserted the count had not shrunk. A row added without a
test raises the length and the unique-key count together, so the assertion
moved with the thing it was meant to constrain. It now records every lookup
`row()` performs and names the rows nothing exercised. On its first real run
it found one, immediately: a test this session had deleted by accident.

**The declaration rewriter did not know about inferred type imports.**
`scripts/prepare-dist.mjs` gives relative specifiers in the emitted `.d.ts`
their `.js`, because a bundler resolves `./Menu` and Node's ESM resolver does
not. It matched `from "./X"` only — and TypeScript writes a different shape
for an _inferred_ type. The day `SplitButton.Item = Menu.Item` was added it
emitted `import("./Menu").MenuItemProps` with no extension, two lines below
an explicit import that was rewritten correctly. `attw` caught it; nothing
else would have, because a bundler resolves both. Same class as the two
cases the comment there already records.

**The rule about documented keys did not know about Enter, Space or
Backspace.** Its regex covered arrows, Home, End, Escape and typeahead — so
`TagInput`, which documents "Enter and comma commit" and "Backspace in an
empty field removes the last tag", had no row in the keyboard map and nothing
said so. The map itself has had Enter and Space rows since it was written, so
the list of keys a component may claim and the list this rule enforced had
drifted apart. Widened, it named exactly two components, both of them new.

**Three assertions had been reading the wrong element, and now a gate says
so.** `page.locator("thead th")` matched Storybook's own zero-height args
table, so a sticky-header check compared 0 to 0 and passed against
`position: static`. The same in `browser/print.spec.ts`, where both table
tests reported on Storybook rather than on `Table`. And
`getByRole("toolbar", { name: "Table actions" })` also matched "Table
actions, with a disabled control", because Playwright matches an accessible
name as a substring — the control list ran across two toolbars.

`packages/ui/test/locators.spec.ts` holds two absolute rules now: a
`page.locator` selector may not be nothing but element names, and a string
accessible name needs `exact: true`. The first version tried to fire only on
a loose query _followed by_ a strict-mode escape, to keep the count at one.
It caught nothing — prettier wraps the call onto its own line, and the real
toolbar bug had a `.locator()` in between — and the only thing it ever
flagged was the sentence in its own docstring describing the pattern. The
absolute version cost ten mechanical edits and is true.

**Four gates were testing a Storybook nobody had built.**
`build-storybook` used the `production` input set, which excludes
`*.stories.tsx`. The exclusion is right for `build` and recorded in ADR 0009;
on a build made of stories it inverts. Measured with a warm cache and one
word changed in a story: `Cache: 1/1 hit (100%)` and the word never reached
`dist`. `browser-test`, `visual-test`, `visual-sweep` and `visual-axes` all
depend on that build, so each was exercising the previous set of stories.

Not only local: CI restores `.nx/cache` between runs through `restore-keys`,
so a push that changed only stories would replay that build and then test
it.

Found because Markus asked why a break test needed `--skip-nx-cache` to see
an edit. It is the right question: reaching for that flag is what working
around a wrong cache looks like from the inside, and the flag had been
hiding the defect it was compensating for.

**The barrel had lost three components, and nothing could see it.**
`Dialog` with `AlertDialog`, and `Field` with `useFieldMessages`, were
finished and documented and not importable from the package root. The
subpath export is a wildcard, so `@labs/ui/components/Dialog` always worked
and every packaging gate passed — the barrel is the one hand-maintained list
in the package and the one place with no check on it. There is one now, read
from the directory rather than from a list.

**Two more gates were describing a list rather than a mechanism.** The
disabled-state rule named `_field.css` and `_choice.css` as the two
stylesheets a component may delegate its disabled look to — so it was true
for the components that existed when it was written and failed `SplitButton`
for doing exactly what `TextField` does. It reads the component's own CSS
imports now. And the `"use client"` rule matched `onClick={` inside
`EmptyState`'s docstring example, demanding a directive the component does
not need: a rule that reads prose changes when somebody improves the
documentation. Comments are stripped first, which is the fourth time that
has mattered here.

**The "no component is driven only by an array of items" rule had a hole.**
Its regex knew `items|options|tabs|pages` and not `columns|rows`. Widening
it needed the rule's actual principle stated: what it protects against is a
fixed arrangement, and a per-item render function returning a node removes
that fixity as surely as compound parts do. Measured before changing it — of
the nine components with a list-shaped prop, eight have parts and children
and none has a render prop, and `DataTable` is the only one the other way
round. So the rule got wider by exactly one component.

## 04 — Forms as a system (stands)

`Field` stands: one place for label, hint, error, required and the wiring,
and all nine field components use it. Before it, nine fields all took
`label`, two took `hint`, **one** took `error` and none took `required` — a
required select with a validation error could not be expressed.

`Form` now sits above it. Errors arrive as a map from field name to
message, which is the shape a server returns them in, and each field finds
its own. With `Form.Summary` and links that move **focus** rather than only
scrolling, `Form.Group` as a real fieldset with a legend, a `busy` state,
and `summaryOn` for the difference between "check on submit" and "the
server has already answered".

Two defects fell out on the way, and they belong in this line because they
say why the stage did not stand earlier:

**`aria-describedby` came from the wrong value.** `Field` computed the
description from its own `error` prop and rendered the message from the
error actually in force. So an error from the form was visible,
`aria-invalid` was set, and the description pointed at nothing. No visual
test can see that. The same mix-up suppressed the message entirely in
`Checkbox`, `Switch` and `RadioGroup`.

**The summary was written five times.** Fields register in an effect, so on
the first pass no error had an owner and every one took the branch meant
for an error whose field the form does not render — the messages appeared
without field names and were then replaced by links. That region is
`role="alert"`. Measured: **5 writes before, 3 with `useDeferredValue`, 1
after**, and `browser/announce.spec.ts` counts them now. Exactly what
`docs/screen-reader-pass.md` has a tester listen for on `Toaster`; here a
count found it, because both states look the same once they settle.

And one finding that stayed hidden behind another: `Button` sets
`type="button"`, correctly, which meant no story could submit a form at
all. With `type="submit"` the test page reloaded — `Form` had never called
`preventDefault`. It does now, unless an `action` is set; a form with
nowhere to go posts to its own URL and loses everything typed. Two bugs
where the first masked the second are the reason "the tests are green" and
"the component works" are different claims.

Nothing named remains open. Per-field validation timing (on change, on
blur) is deliberately absent: what counts as valid is the caller's rule,
and a library that takes it over ends up owning business logic.

## 06 — Accessibility (half)

Stands: the keyboard contract as data with one test per row; all 55 WCAG
2.2 criteria at levels A and AA with the gate that checks each one (25 have
one, 11 are manual, 9 belong to the product, 10 do not apply here); and two
automated screen-reader layers — name, description, role and state per
node, plus the tree in reading order.

Open: real assistive technology. 147 cells in `src/audit/screen-readers.ts`,
all "not yet". NVDA and VoiceOver can be driven with Guidepup, but that
needs a Windows or macOS runner and this CI runs on Linux. The rows are for
what only real AT shows: verbosity, punctuation, what a reader says on
entering a region.

The concrete way in is `docs/screen-reader-pass.md`: seven components, one
pairing, about forty-five minutes. Not 147 cells, because nobody starts a
list of 108 rows. The note also says what _not_ to look for: names,
descriptions, roles and order are covered by `browser/announce.spec.ts`.
What is listened for is whether what gets said is usable by a person — too
much, too little, wrong order, or twice.

Also open: walking the 11 manual WCAG criteria once and dating them. Each
is in `packages/ui/src/audit/wcag.ts` with its own "what to look for".

## 07 — Distribution (half)

Stands: the package shape is checked (publint, attw), every CSS import in
the build resolves, a consumer bundle proves that one component costs one
component, and the deprecation window has dates plus a gate that fails when
one lapses.

Open and not possible without credentials: publishing to a private
registry, canary builds from `main`, and the version spread across
consumers — the real version of a design system is the oldest one still in
production.

Per-component semver has its foundation now: `packages/ui/api-surface.md`
holds every exported signature with the prose stripped, and
`ui:api-surface` fails when it drifts. That makes "which component moved" a
line in a diff instead of a reading exercise, and `CHANGELOG.md` is kept per
component with a level — breaking, added, fixed, internal.

That enforcement now exists. `scripts/changelog-gate.mjs` fails when
`packages/ui/api-surface.md` differs from the base and `CHANGELOG.md` does
not, using the same base `nx affected` uses — two ways of deciding "what
changed" that can disagree is how a gate ends up reporting on a different
diff than the one under review.

It checks that somebody was made to write an entry and nothing more: not
which component, not the level, not the wording. A check that read the prose
would be guessing, and the mechanical half is the half worth mechanising.

## 08 — Design and code as one source (struck)

Struck, not deferred. Figma variables, Code Connect and an inventory diff
all need a Figma licence that does not exist here and for which there is no
plan.

A stage that stands at "open" indefinitely is no longer a roadmap but a
list of things somebody once wanted, and it shifts the weight of the other
eleven. The DTCG export stays, because it is useful on its own: it makes
the token graph portable whether or not a design tool ever reads it.

If that changes, the way in is one-directional: generate Figma variables
**from** the DTCG export, with code as the source. Two-way sync is where
this goes wrong.

## 10 — Governance (half)

Stands: `CODEOWNERS` per layer, an RFC form as the front door, the review
bar in `CONTRIBUTING.md`, response times as a commitment, and this roadmap.

Open and not solvable in code: office hours and conversations with the
consuming teams. An adoption number says a team built around the system;
only a conversation says why.

The bottleneck is in `CONTRIBUTING.md` and belongs here too: one
maintainer. The system does not grow past what one person can carry.

## 11 — Observability (open, needs a list of repos)

Adoption is measured today by this repository reading its own source. That
holds for one consumer and not for a company.

What would be built, in the order it pays off:

**1. A static scanner, as its own target.** It clones the consumers
shallowly, reads their `package.json` for the `@labs/ui` version and greps
their source against `packages/ui/inventory.json` — which exists now, and is
the reason this step is small today. Output per repo: version, components
used, props used per component, tokens used, and the number that says the
most — **places that look like a re-implementation**: a `<button className=`
without `uix-button`, a hex colour in a CSS file, a `border-radius` in px.

**2. The version spread.** The real version of a design system is the
oldest one still in production. A table of repo → version, with the
distance to the newest, is the number that decides whether a deprecation
window was realistic.

**3. A report in this repo's CI**, so the number moves without anyone
having to remember — exactly like `ui:adoption` today.

What I need for it, and only this:

- **The list of repos** that use `@labs/ui` or should. Including the ones
  that do not yet — "should and does not" is the more interesting half.
- **Read access** to them. A fine-grained token with `contents: read` on
  those repos, as a secret; or, if they are all in the same organisation,
  `GITHUB_TOKEN` with a widened scope.

Runtime telemetry is explicitly last: "which props are used in production"
is a different question from "which are imported", but it needs a flag, a
consent and an endpoint — and the static scanner answers 80 % of it without
any of those.

## 12 — Readable by an agent (stands)

Stands: `packages/ui/inventory.json`, generated from source — 49
components, 352 own props with type and documentation, 28 compound parts,
the override slots, the status, and the sentences saying when to reach for
something else. A gate fails when the file has drifted. Plus
`AGENTS.md`: the rules as instructions, each with the gate that enforces
it, and a test that those citations resolve.

That server exists: `packages/ui-mcp`. Four tools and one resource over
stdio, answering only from files that already have a gate behind them —
the inventory, the keyboard map, the token registry and the API surface.
The constraint is the design: it may not know anything this repository does
not already check, so there is no second source to go stale.

The question it answers that a props table cannot is "which one do I reach
for". `find_component` ranks on the `insteadWhen` sentences, which exist to
send somebody elsewhere: asked for "let someone pick several suppliers from
a long list" it answers `Combobox`, because that component's own sentence
says "a list too long to scan" and "hold more than one answer".

Two of the four sources are parsed rather than imported, and that is where
the risk sits — a regex over a file whose shape changes returns fewer rows
rather than an error. `packages/ui-mcp/test/data.spec.ts` counts what it parsed against the
imported source, and both earlier token parsers needed it: one produced
`--uix-semantic-accent` for a property called `--uix-accent`, the next
stopped inside a font stack's escaped quote and returned 151 of 154. Neither
failed. Both answered.

## How this should be read

"Stands" means: there is a gate, and the gate has been broken on purpose
once and watched while it fell. "Half" means: the measurable part stands
and the rest is named. "Open" means: none of it exists, and the line says
why — credentials, a second repository, or simply work.

What is **not** here is a date per stage. A roadmap with invented deadlines
is worse than one without, because it disappoints twice.
