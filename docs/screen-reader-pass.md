# The first screen-reader pass

What to check, in order, and how to tell a problem when you hear one.

**Not scheduled.** Markus struck the manual pass from the roadmap on
2026-08-27: it needs a person at a screen reader and there is not one. This
note stays because it is the cheapest way in if that changes — forty-five
minutes, not 174 cells — and because roadmap stage 06 now points at it.

The matrix in `packages/ui/src/audit/screen-readers.ts` has 174 cells.
Those are not the task. The task is this note: **seven components, one
pairing, about forty-five minutes.** After it you will know more about this
library than any automated run can tell you, and the remaining 129 cells
are legwork that can be shared out.

## Setup

One pairing is enough for a first pass. On a Mac, VoiceOver with Safari is
the obvious choice: **Cmd + F5** turns it on, **Ctrl + Option + arrow
keys** moves, **Ctrl + Option + A** reads on from here.

```sh
pnpm nx run ui:storybook
```

What the automated layers already cover, so you do not go looking for it:
that every control has a name, that hint and error arrive as its
description, that the order in the tree is right, that roles and states are
set. That is in `browser/announce.spec.ts` and it runs in CI.

**So what you are listening for is something else:** whether what gets said
is usable by a person. Too much, too little, in the wrong order, or twice.

## 1. TextField — `components-textfield--matrix`

Tab through all six fields.

- On "With error": does the **label come before the error**, or the error
  first? A reader that opens with the error leaves you guessing what it
  refers to.
- On "Required": is "required" said **once**? That was doubled until
  recently, and the automated name test only catches duplication in the
  name — not the case where a reader announces the state from the attribute
  as well and it still ends up sounding twice.
- On "With affixes": are `>=` and `units` read out? They are `aria-hidden`,
  so they should **not** be. If they are, the unit has vanished for a
  reader, and then `aria-hidden` is the wrong call there.

## 2. Select — `components-select--matrix`

- Is the number of options announced? "1 of 3" is useful; nothing is not.
- On opening: does the reader read the current selection before you move?
- The disabled select: does it say "dimmed", "unavailable", or nothing?

## 3. Dialog — `components-dialog--open-with-page-behind`

The most important cell in the whole matrix, because the modal semantics
here are hand-built and Base UI did not supply them.

- On opening: are **title and description** announced, or only "dialog"?
- Move with Ctrl+Option+arrow **past the dialog**. Do you reach the button
  behind it? You should not. If you do, `inert` is not taking effect — and
  that is the difference between "looks modal" and "is modal".
- Escape: does the reader then say where focus landed?

## 4. Toaster — `components-toaster--imperative`

Live regions are where libraries most often get it wrong, and no static
test sees it.

- Click the trigger. Is the toast **announced while you are elsewhere**?
  That is the point of it.
- Is it announced **interrupting** (mid-sentence), or does it wait? For
  `success` it should wait; for `danger` it should not.
- Does it come **twice**? A toast announced twice usually means the region
  and its content are both live.

## 5. Tabs — `components-tabs--matrix`

- Arrow right: does the reader announce the new tab **without** claiming it
  is selected? This component activates manually, and a reader saying
  "selected" while only focus moved is misleading.
- After Enter: does the panel arrive, or do you have to go find it?
- The disabled tab: announced as "dimmed", or skipped?

## 6. Table — `components-table--wide-columns`

- Inside a cell: is the **column header** said too? Without it a table is a
  desert of numbers.
- Is the position announced ("row 2 of 3")?
- On entering and leaving: does it say "table, 3 rows, 6 columns" and, at
  the end, "end of table"?

## 7. DataTable — `components-datatable--ten-thousand-rows`

New, and the most interesting cell in the matrix, because a number is at
stake here that no visual test can check.

- On entering: does the reader say **ten thousand rows**? It should. A
  virtualised grid has only a few dozen `<tr>` in the DOM, and without
  `aria-rowcount` a reader announces exactly those.
  `browser/runtime.spec.ts` checks the attribute is there and correct; what
  it cannot check is whether a real reader uses it.
- Move down, past the edge of the window. Does it keep counting correctly,
  or start again at 1? And **does anything happen at all** when the rows
  beneath it are swapped in — or does it lose its place?
- On sorting: does it say the new direction? `aria-sort` is on the header
  cell. The arrow beside it is for the eye and says nothing.
- On a selection: does "3 rows selected" arrive while you are elsewhere?
  That is a `role="status"` region and the same mechanism as the toaster.

## What you write down

Per cell in `screen-readers.ts`: the date and **what you heard** — not what
should have come.

```ts
{ component: "Dialog", why: "…", cells: {
  "voiceover-safari": {
    checked: "2026-08-28",
    notes:
      "Title and description arrive. Moving past the dialog does not " +
      "reach the button behind it. After Escape, VO says only 'button' " +
      "and not which one — focus lands correctly, the announcement is " +
      "thin.",
  },
  …
}}
```

The test in `packages/ui/test/audit.spec.ts` requires both: an ISO date and
notes. A dated pass with nothing written down is indistinguishable from no
pass at all.

And if something sounds wrong but you are not sure whether it is the
component or the reader: write down that you were unsure. That is a usable
note. "Probably fine" is not.
