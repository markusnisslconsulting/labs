/**
 * The keyboard contract, as data.
 *
 * Each component's TSDoc states what its keyboard does. Eleven of them
 * name a key — Arrow, Home, End, Escape, Enter, Space, PageUp, typeahead
 * — and before this file six key presses were asserted in the whole
 * repository, three of which were written the same afternoon for one
 * slider. The rest was documentation.
 *
 * That gap is not academic. It is exactly where the Dialog defect lived:
 * the component's own docs said it wired `aria-modal` and trapped focus,
 * and measured against Base UI `1.0.0-rc.0` it did neither. A claim
 * nobody exercises is a claim that drifts.
 *
 * Two kinds of row, and the distinction decides how a row can be tested:
 *
 *   - `owner: "component"` — a JS keydown handler, ours or Base UI's.
 *     Roving focus in a tablist, a menu's typeahead, Escape on a popup.
 *   - `owner: "platform"` — the browser's own behaviour on a native
 *     control. Arrow keys on a radio group, Space on a checkbox, Home on
 *     a range input. The library's claim here is narrower and still worth
 *     holding: that nothing we did took it away. CSS can. A wrapper with
 *     `pointer-events: none`, an input moved off-screen instead of
 *     clipped, an `appearance` reset that swallows focus — each of those
 *     removes platform behaviour while the component keeps saying it is
 *     the platform's.
 *
 * Platform rows need trusted key events, which is why every row is
 * exercised from Playwright rather than from a play function. Measured:
 * `userEvent.keyboard` moves a range input's label and never its thumb,
 * because a browser only runs a native control's key behaviour for
 * trusted events. A story-based suite would have reported the opposite of
 * the truth.
 */

export interface KeyboardRow {
  /** The component this row belongs to, as it appears in the sidebar. */
  component: string;
  /** The story the row is exercised against. */
  story: string;
  /** Who implements the behaviour, and therefore what a failure means. */
  owner: "component" | "platform";
  /** The key, spelled as Playwright presses it. */
  key: string;
  /** What a reader is promised, in one line, for the docs table. */
  expectation: string;
}

export const KEYBOARD_MAP: KeyboardRow[] = [
  /* Tabs. The pattern has two variants and the docs used to name
     neither: with automatic activation an arrow key changes the panel,
     with manual activation it only moves focus and Enter or Space
     commits. Measured: ArrowRight moved focus to "Events" while
     aria-selected stayed on "Product row", and Enter then moved it. So
     this is manual activation, which is the right choice here — inactive
     panels are unmounted, so arrowing through five tabs under automatic
     activation would mount and unmount five panels.
     The first version of these rows assumed automatic activation. Home
     and End failed and ArrowRight passed vacuously: it asserted the first
     tab was unselected, which was already true. */
  {
    component: "Tabs",
    story: "components-tabs--three-panels",
    owner: "component",
    key: "ArrowRight",
    expectation: "moves focus to the next tab without selecting it",
  },
  {
    component: "Tabs",
    story: "components-tabs--three-panels",
    owner: "component",
    key: "Home",
    expectation: "moves focus to the first tab",
  },
  {
    component: "Tabs",
    story: "components-tabs--three-panels",
    owner: "component",
    key: "End",
    expectation: "moves focus to the last tab",
  },
  {
    component: "Tabs",
    story: "components-tabs--three-panels",
    owner: "component",
    key: "Enter",
    expectation: "selects the focused tab and shows its panel",
  },

  /* Accordion — "Enter/Space, Arrow navigation between triggers". */
  {
    component: "Accordion",
    story: "components-accordion--single-open",
    owner: "component",
    key: "Enter",
    expectation: "toggles the focused section",
  },
  {
    component: "Accordion",
    story: "components-accordion--single-open",
    owner: "component",
    key: "Space",
    expectation: "toggles the focused section",
  },
  {
    component: "Accordion",
    story: "components-accordion--single-open",
    owner: "component",
    key: "ArrowDown",
    expectation: "moves focus to the next section's trigger",
  },

  /* RadioGroup — "the platform gives arrow-key navigation and the
     single-tab-stop behaviour for free". */
  {
    component: "RadioGroup",
    story: "components-radiogroup--shipping-speed",
    owner: "platform",
    key: "ArrowDown",
    expectation: "moves the selection to the next option",
  },

  /* Slider — "arrows, PageUp/Down, Home/End come from the platform". */
  {
    component: "Slider",
    story: "components-slider--matrix",
    owner: "platform",
    key: "ArrowRight",
    expectation: "raises the value by one step",
  },
  {
    component: "Slider",
    story: "components-slider--matrix",
    owner: "platform",
    key: "Home",
    expectation: "goes to the minimum",
  },
  {
    component: "Slider",
    story: "components-slider--matrix",
    owner: "platform",
    key: "End",
    expectation: "goes to the maximum",
  },

  /* Checkbox — "keeps the root focusable and handles Space". */
  {
    component: "Checkbox",
    story: "components-checkbox--matrix",
    owner: "component",
    key: "Space",
    expectation: "toggles the checkbox",
  },

  /* Switch — the same promise, one component over. */
  {
    component: "Switch",
    story: "components-switch--matrix",
    owner: "component",
    key: "Space",
    expectation: "toggles the switch",
  },

  /* Dialog — "closes on Escape" and "restores focus to the trigger". */
  {
    component: "Dialog",
    story: "components-dialog--open-with-page-behind",
    owner: "component",
    key: "Escape",
    expectation: "closes the dialog",
  },

  /* Popover — "closes on Escape and returns focus to the trigger". */
  {
    component: "Popover",
    story: "components-popover--open",
    owner: "component",
    key: "Escape",
    expectation: "closes the popover and returns focus to the trigger",
  },

  /* Tooltip — "Escape closes". And the wiring underneath it, because a
     tooltip nobody can hear has nothing to close. */
  {
    component: "Tooltip",
    story: "components-tooltip--open-state",
    owner: "component",
    key: "Escape",
    expectation: "dismisses the tooltip",
  },

  /* Menu — "roving focus, Arrow/Home/End/Escape, and typeahead". */
  {
    component: "Menu",
    story: "components-menu--open",
    owner: "component",
    key: "ArrowDown",
    expectation: "moves the highlight to the next item",
  },
  {
    component: "Menu",
    story: "components-menu--open",
    owner: "component",
    key: "End",
    expectation: "highlights the last item",
  },
  {
    component: "Menu",
    story: "components-menu--open",
    owner: "component",
    key: "Escape",
    expectation: "closes the menu and returns focus to the trigger",
  },
  {
    component: "Form",
    story: "components-form--grouped",
    owner: "platform",
    key: "Enter",
    expectation:
      "in a text field, submits the form — the browser's implicit " +
      "submission, which needs a submit button to exist",
  },
  {
    component: "DataTable",
    story: "components-datatable--matrix",
    owner: "platform",
    key: "Enter",
    expectation: "on a column header, sorts by that column",
  },
  {
    component: "DataTable",
    story: "components-datatable--matrix",
    owner: "platform",
    key: "Space",
    expectation: "on a row's checkbox, selects the row",
  },
  {
    component: "DataTable",
    story: "components-datatable--ten-thousand-rows",
    owner: "platform",
    key: "ArrowDown",
    expectation:
      "with the scroll viewport focused, scrolls the rows — the reason " +
      "the viewport is a tab stop at all",
  },
  /* Drawer — the same popup contract as Dialog, and worth its own row
     because a drawer is the one that is sometimes not modal: Escape has to
     close it either way. */
  {
    component: "Drawer",
    story: "components-drawer--non-modal-filter-panel",
    owner: "component",
    key: "Escape",
    /* Just the close. Focus restoration needs a trigger to return to and
       this fixture opens by default, so that half is asserted in
       `Drawer.stories.tsx` where a trigger exists. A row must not promise
       more than the test under it checks. */
    expectation: "closes the panel",
  },
  /* Toolbar — "one tab stop for the whole group, arrows move between the
     controls". The whole reason the component exists rather than a div. */
  {
    component: "Toolbar",
    story: "components-toolbar--matrix",
    owner: "component",
    key: "ArrowRight",
    expectation: "moves to the next enabled control, wrapping at the end",
  },
  {
    component: "Toolbar",
    story: "components-toolbar--matrix",
    owner: "component",
    key: "Home",
    expectation: "moves to the first control",
  },
  {
    component: "Toolbar",
    story: "components-toolbar--matrix",
    owner: "component",
    key: "End",
    expectation: "moves to the last control",
  },
  /* TagInput — "Enter and comma commit; Backspace in an empty field
     removes the last tag". */
  {
    component: "TagInput",
    story: "components-taginput--tags-rendered-by-the-caller",
    owner: "component",
    key: "Enter",
    expectation: "commits the draft as a tag",
  },
  {
    component: "TagInput",
    story: "components-taginput--tags-rendered-by-the-caller",
    owner: "component",
    key: "Backspace",
    expectation: "on an empty field, removes the last tag",
  },

  /* InlineEdit — "Escape cancels and restores the original value; Enter
     commits". */
  {
    component: "InlineEdit",
    story: "components-inlineedit--matrix",
    owner: "component",
    key: "Enter",
    expectation: "commits the edit and returns focus to the trigger",
  },
  {
    component: "InlineEdit",
    story: "components-inlineedit--matrix",
    owner: "component",
    key: "Escape",
    expectation: "abandons the edit and restores the original value",
  },
  /* Tree — the WAI-ARIA tree pattern: one tab stop, arrows do the work.
     Right and left are the two that carry the structure, and they each do
     two different things depending on where they are. */
  {
    component: "Tree",
    story: "components-tree--matrix",
    owner: "component",
    key: "ArrowDown",
    expectation: "moves to the next visible row, across branch boundaries",
  },
  {
    component: "Tree",
    story: "components-tree--matrix",
    owner: "component",
    key: "ArrowRight",
    expectation: "opens a closed branch, then steps into an open one",
  },
  {
    component: "Tree",
    story: "components-tree--matrix",
    owner: "component",
    key: "ArrowLeft",
    expectation: "closes an open branch, then steps out to the parent",
  },
  {
    component: "Tree",
    story: "components-tree--matrix",
    owner: "component",
    key: "End",
    expectation: "moves to the last visible row",
  },
  /* CommandPalette — the combobox-over-listbox pattern: focus never leaves
     the field, and the arrows move `aria-activedescendant` instead. */
  {
    component: "CommandPalette",
    story: "components-commandpalette--matrix",
    owner: "component",
    key: "ArrowDown",
    expectation: "moves the highlight to the next command without moving focus",
  },
  {
    component: "CommandPalette",
    story: "components-commandpalette--matrix",
    owner: "component",
    key: "End",
    expectation: "highlights the last command",
  },
];
