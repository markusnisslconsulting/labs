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
];
