/**
 * The screen-reader matrix: three pairings, per component, dated.
 *
 * Stage 06 of the readiness roadmap asks for this by name — "NVDA with
 * Firefox, JAWS with Chrome, VoiceOver with Safari, per component,
 * recorded and dated. Manual, scheduled, and written down — not a gate."
 *
 * Every cell below reads `checked: null`. That is not an oversight and it
 * is the most important thing in this file: nobody has run a screen
 * reader against this library. axe passing in two themes is not the same
 * evidence, and a matrix filled in from what the markup *ought* to
 * announce would be worse than an empty one — it would be the document
 * someone points at instead of listening.
 *
 * What this file is for, empty: it makes the absence countable.
 * `nx run ui:audit` prints how many of the 105 cells have ever been
 * checked and how old the oldest is, so the gap appears in the same place
 * as every other measurement instead of living in a person's memory.
 *
 * How to fill a cell: run the component's stories with that pairing, work
 * through the keyboard map for it, and record what was heard — not what
 * should have been. `notes` is for the discrepancy, because the useful
 * output of this exercise is the list of things that announce differently
 * from the way the docs say they do. Tooltip shipped with no role and no
 * aria-describedby for as long as it existed; a single VoiceOver pass
 * would have caught it in ten seconds.
 */

export type Pairing = "nvda-firefox" | "jaws-chrome" | "voiceover-safari";

export const PAIRINGS: Array<{ id: Pairing; label: string; platform: string }> =
  [
    { id: "nvda-firefox", label: "NVDA + Firefox", platform: "Windows" },
    { id: "jaws-chrome", label: "JAWS + Chrome", platform: "Windows" },
    {
      id: "voiceover-safari",
      label: "VoiceOver + Safari",
      platform: "macOS / iOS",
    },
  ];

export interface Cell {
  /** ISO date of the pass, or null when it has never been run. */
  checked: string | null;
  /** What was heard, and where it differed from the documentation. */
  notes?: string;
}

export type ScreenReaderRow = Record<Pairing, Cell>;

/** Components whose announcement is worth a pass, in rough priority order. */
const blank = (): ScreenReaderRow => ({
  "nvda-firefox": { checked: null },
  "jaws-chrome": { checked: null },
  "voiceover-safari": { checked: null },
});

/**
 * The order is the order to work through, not alphabetical.
 *
 * Forms first because a mislabelled field costs a user the task, then the
 * things that take focus away from the page, then the ones that speak
 * without being asked, then the rest. A partial pass down this list is
 * worth more than a complete pass in alphabetical order.
 */
export const SCREEN_READER_MATRIX: Array<{
  component: string;
  why: string;
  cells: ScreenReaderRow;
}> = [
  {
    component: "TextField",
    why: "the label, hint and error wiring every other field inherits",
    cells: blank(),
  },
  {
    component: "Field",
    why: "the wiring itself, around a control the library does not ship",
    cells: blank(),
  },
  {
    component: "Select",
    why: "a native picker inside our own row and adornments",
    cells: blank(),
  },
  {
    component: "Combobox",
    why: "datalist announcements differ most between readers",
    cells: blank(),
  },
  {
    component: "RadioGroup",
    why: "the group name is announced once and inherited",
    cells: blank(),
  },
  {
    component: "Checkbox",
    why: "mixed state has three spellings across readers",
    cells: blank(),
  },
  {
    component: "Switch",
    why: "role=switch is younger than the readers that read it",
    cells: blank(),
  },
  {
    component: "NumberField",
    why: "the steppers are named by us, not by the platform",
    cells: blank(),
  },
  {
    component: "Slider",
    why: "value announcements come from the platform",
    cells: blank(),
  },
  {
    component: "Dialog",
    why: "the modal semantics are ours, not Base UI's",
    cells: blank(),
  },
  {
    component: "Popover",
    why: "non-modal, so the page behind stays readable",
    cells: blank(),
  },
  { component: "Menu", why: "roving focus and typeahead", cells: blank() },
  {
    component: "Tooltip",
    why: "shipped with no role and no description until measured",
    cells: blank(),
  },
  {
    component: "Toaster",
    why: "a live region: when it announces matters",
    cells: blank(),
  },
  {
    component: "Alert",
    why: "status against alert, polite against assertive",
    cells: blank(),
  },
  { component: "Banner", why: "the same choice, page-wide", cells: blank() },
  {
    component: "ProgressBar",
    why: "indeterminate has no value to announce",
    cells: blank(),
  },
  {
    component: "Spinner",
    why: "a status role whose only content is text",
    cells: blank(),
  },
  {
    component: "Tabs",
    why: "manual activation is heard differently from automatic",
    cells: blank(),
  },
  {
    component: "Accordion",
    why: "expanded state on a heading trigger",
    cells: blank(),
  },
  {
    component: "Table",
    why: "header association in a scrolling region",
    cells: blank(),
  },
  {
    component: "Pagination",
    why: "a nav landmark with a current page",
    cells: blank(),
  },
  {
    component: "Breadcrumb",
    why: "aria-current on the last crumb",
    cells: blank(),
  },
  {
    component: "SegmentedControl",
    why: "aria-pressed rather than a radio set",
    cells: blank(),
  },
  {
    component: "Chip",
    why: "aria-pressed on something that looks like a tag",
    cells: blank(),
  },
  {
    component: "Button",
    why: "loading sets aria-busy and aria-disabled together",
    cells: blank(),
  },
  {
    component: "IconButton",
    why: "the name is an aria-label with no visible text",
    cells: blank(),
  },
  {
    component: "SearchInput",
    why: "a hidden label on a native search input",
    cells: blank(),
  },
  {
    component: "Avatar",
    why: "initials against an image against nothing",
    cells: blank(),
  },
  {
    component: "Badge",
    why: "decorative or meaningful, depending on the caller",
    cells: blank(),
  },
  {
    component: "StatusPill",
    why: "tone plus text, where tone is never the only signal",
    cells: blank(),
  },
  {
    component: "Skeleton",
    why: "hidden from assistive technology on purpose",
    cells: blank(),
  },
  {
    component: "Card",
    why: "a region with slots the caller fills",
    cells: blank(),
  },
  { component: "Panel", why: "the same, one level down", cells: blank() },
  { component: "Divider", why: "separator or presentation", cells: blank() },
];
