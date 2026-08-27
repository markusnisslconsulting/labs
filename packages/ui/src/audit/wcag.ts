/**
 * WCAG 2.2 Level AA, criterion by criterion.
 *
 * The roadmap's stage 06 asks for this by name, and the reason is in the
 * stage's own title: axe finds a minority of real accessibility problems.
 * A green pipeline says nothing about focus order matching reading order,
 * whether an error message says what to do, or whether a live region
 * announces at a useful moment.
 *
 * So each criterion carries one of four statuses, and the difference
 * between them is what a reader can conclude:
 *
 *   - `gate` — something in this repository fails the build when it
 *     breaks, and `evidence` names it. This is the only status that is a
 *     guarantee.
 *   - `manual` — a person has to look. `evidence` says what they should
 *     look at. Nothing here is claimed to be satisfied.
 *   - `product` — the criterion belongs to the page a component sits in,
 *     not to the component. A library cannot satisfy "Bypass Blocks"; an
 *     application can, and this row says so rather than going quiet.
 *   - `n/a` — nothing in the library can trigger it. No audio, no video,
 *     no authentication.
 *
 * What this file must never do is claim `gate` for something no gate
 * checks. A conformance table that overstates is worse than none: it is
 * the document someone points at instead of testing.
 */

export type CriterionStatus = "gate" | "manual" | "product" | "n/a";

export interface Criterion {
  /** e.g. "1.4.3" */
  id: string;
  level: "A" | "AA";
  name: string;
  status: CriterionStatus;
  /** For `gate`, the target or file that fails. For the rest, what to do. */
  evidence: string;
  /** Marks the six criteria WCAG 2.2 added, which most audits predate. */
  new22?: boolean;
}

export const WCAG_22_AA: Criterion[] = [
  /* ---------------------------------------------------------- Perceivable */
  {
    id: "1.1.1",
    level: "A",
    name: "Non-text Content",
    status: "gate",
    evidence:
      "axe runs on every story in both themes (ui:test-storybook) and " +
      "fails on an image without a name. Decorative marks carry aria-hidden.",
  },
  {
    id: "1.2.1",
    level: "A",
    name: "Audio-only and Video-only (Prerecorded)",
    status: "n/a",
    evidence: "The library renders no media.",
  },
  {
    id: "1.2.2",
    level: "A",
    name: "Captions (Prerecorded)",
    status: "n/a",
    evidence: "The library renders no media.",
  },
  {
    id: "1.2.3",
    level: "A",
    name: "Audio Description or Media Alternative",
    status: "n/a",
    evidence: "The library renders no media.",
  },
  {
    id: "1.2.4",
    level: "AA",
    name: "Captions (Live)",
    status: "n/a",
    evidence: "The library renders no media.",
  },
  {
    id: "1.2.5",
    level: "AA",
    name: "Audio Description (Prerecorded)",
    status: "n/a",
    evidence: "The library renders no media.",
  },
  {
    id: "1.3.1",
    level: "A",
    name: "Info and Relationships",
    status: "gate",
    evidence:
      "Field owns the label/hint/error wiring for all nine field " +
      "components and api.spec.ts fails a field that re-derives it; axe " +
      "checks the resulting relationships per story.",
  },
  {
    id: "1.3.2",
    level: "A",
    name: "Meaningful Sequence",
    status: "manual",
    evidence:
      "DOM order is the reading order in every component, but no gate " +
      "compares it to the visual order. Check when a layout uses grid " +
      "placement or order.",
  },
  {
    id: "1.3.3",
    level: "A",
    name: "Sensory Characteristics",
    status: "manual",
    evidence:
      "No component's instructions refer to shape or position. Review new " +
      "copy for 'the button on the right'.",
  },
  {
    id: "1.3.4",
    level: "AA",
    name: "Orientation",
    status: "manual",
    evidence:
      "Nothing locks orientation. The narrow suite covers 360px width; " +
      "landscape on a phone is unreviewed.",
  },
  {
    id: "1.3.5",
    level: "AA",
    name: "Identify Input Purpose",
    status: "manual",
    evidence:
      "TextField forwards autocomplete, and no gate requires a caller to " +
      "set it. A product collecting a name or an address owes this.",
  },
  {
    id: "1.4.1",
    level: "A",
    name: "Use of Color",
    status: "gate",
    evidence:
      "tokens.spec.ts requires every status component to repeat its tone " +
      "in text or a shape, and the forced-colors suite renders each with " +
      "author colours thrown away.",
  },
  {
    id: "1.4.2",
    level: "A",
    name: "Audio Control",
    status: "n/a",
    evidence: "Nothing plays automatically.",
  },
  {
    id: "1.4.3",
    level: "AA",
    name: "Contrast (Minimum)",
    status: "gate",
    evidence:
      "ui:contrast-check — 200 pairings across two brands, two themes and " +
      "two contrast settings, each against its 4.5 or 3.0 target.",
  },
  {
    id: "1.4.4",
    level: "AA",
    name: "Resize Text",
    status: "gate",
    evidence:
      "browser/scale.spec.ts renders every matrix at raised root font " +
      "sizes; tokens.spec.ts fails any stylesheet that pins the root size.",
  },
  {
    id: "1.4.5",
    level: "AA",
    name: "Images of Text",
    status: "gate",
    evidence:
      "tokens.spec.ts rejects glyph icons; every icon is an SVG and every " +
      "label is text.",
  },
  {
    id: "1.4.10",
    level: "AA",
    name: "Reflow",
    status: "gate",
    evidence:
      "browser/narrow.spec.ts asserts no horizontal overflow at 360px for " +
      "the components most likely to produce it.",
  },
  {
    id: "1.4.11",
    level: "AA",
    name: "Non-text Contrast",
    status: "gate",
    evidence:
      "scripts/tokens/contrast.ts includes focus ring, accent fill and " +
      "surface pairings at 3:1. Inactive controls are exempt by the " +
      "criterion and the file records that rather than inventing a " +
      "threshold.",
  },
  {
    id: "1.4.12",
    level: "AA",
    name: "Text Spacing",
    status: "manual",
    evidence:
      "Nothing sets a fixed line-height in px or forbids user overrides, " +
      "but no gate applies the criterion's spacing bookmarklet. Worth a " +
      "scheduled pass.",
  },
  {
    id: "1.4.13",
    level: "AA",
    name: "Content on Hover or Focus",
    status: "gate",
    evidence:
      "Tooltip is dismissible with Escape (browser/keyboard.spec.ts), " +
      "hoverable via Base UI, and persistent until dismissed.",
  },

  /* ---------------------------------------------------------- Operable */
  {
    id: "2.1.1",
    level: "A",
    name: "Keyboard",
    status: "gate",
    evidence:
      "src/keyboard.map.ts with a test per row in browser/keyboard.spec.ts, " +
      "plus a keyboard story per operable component enforced by " +
      "ui:story-coverage.",
  },
  {
    id: "2.1.2",
    level: "A",
    name: "No Keyboard Trap",
    status: "gate",
    evidence:
      "browser/focus.spec.ts drives Tab through the modal and asserts " +
      "Escape releases it; useInertBackground is what makes the trap " +
      "escapable rather than absolute.",
  },
  {
    id: "2.1.4",
    level: "A",
    name: "Character Key Shortcuts",
    status: "n/a",
    evidence: "No component binds a single-character shortcut.",
  },
  {
    id: "2.2.1",
    level: "A",
    name: "Timing Adjustable",
    status: "gate",
    evidence:
      "Toast timeouts are per severity and warning/danger default to 0 — " +
      "they stay until dismissed. Every timeout is a caller-settable prop.",
  },
  {
    id: "2.2.2",
    level: "A",
    name: "Pause, Stop, Hide",
    status: "manual",
    evidence:
      "Spinner and the indeterminate ProgressBar animate indefinitely. " +
      "prefers-reduced-motion stops them; the criterion's five-second rule " +
      "for auto-updating content is unreviewed.",
  },
  {
    id: "2.3.1",
    level: "A",
    name: "Three Flashes or Below Threshold",
    status: "n/a",
    evidence: "No animation flashes; the fastest is a 600ms spin.",
  },
  {
    id: "2.4.1",
    level: "A",
    name: "Bypass Blocks",
    status: "product",
    evidence:
      "A skip link belongs to the page. The labs site has one; the library " +
      "cannot supply it.",
  },
  {
    id: "2.4.2",
    level: "A",
    name: "Page Titled",
    status: "product",
    evidence: "A page-level criterion; site:a11y covers the labs site.",
  },
  {
    id: "2.4.3",
    level: "A",
    name: "Focus Order",
    status: "gate",
    evidence:
      "browser/keyboard.spec.ts reaches every control by Tab from the top " +
      "of the document rather than by .focus(), so the order is part of " +
      "what each row asserts.",
  },
  {
    id: "2.4.4",
    level: "A",
    name: "Link Purpose (In Context)",
    status: "manual",
    evidence:
      "Breadcrumb and Badge render links from caller text. Review copy for " +
      "'click here'.",
  },
  {
    id: "2.4.5",
    level: "AA",
    name: "Multiple Ways",
    status: "product",
    evidence: "A site-level criterion.",
  },
  {
    id: "2.4.6",
    level: "AA",
    name: "Headings and Labels",
    status: "gate",
    evidence:
      "Every field takes a required label prop; api.spec.ts fails a field " +
      "without one, and site:a11y checks heading order per page.",
  },
  {
    id: "2.4.7",
    level: "AA",
    name: "Focus Visible",
    status: "gate",
    evidence:
      "One focus contract in packages/ui/src/styles/base.css at :where() " +
      "specificity, asserted by test/stories.spec.ts, and " +
      "browser/focus.spec.ts measures the ring.",
  },
  {
    id: "2.4.11",
    level: "AA",
    name: "Focus Not Obscured (Minimum)",
    status: "manual",
    new22: true,
    evidence:
      "Nothing here pins a sticky header, which is the usual cause. A " +
      "product with one owes the check; no gate can see it from the " +
      "library.",
  },
  {
    id: "2.5.1",
    level: "A",
    name: "Pointer Gestures",
    status: "gate",
    evidence:
      "Slider is a native range: it moves with a single pointer and with " +
      "arrows. No component requires a path or a multipoint gesture.",
  },
  {
    id: "2.5.2",
    level: "A",
    name: "Pointer Cancellation",
    status: "manual",
    evidence:
      "Every action fires on click, not pointerdown, but no gate asserts " +
      "it. Worth a rule.",
  },
  {
    id: "2.5.3",
    level: "A",
    name: "Label in Name",
    status: "gate",
    evidence:
      "api.spec.ts forbids a compiled-in user-facing string, including " +
      "text between tags, so a visible label and its accessible name come " +
      "from the same prop.",
  },
  {
    id: "2.5.4",
    level: "A",
    name: "Motion Actuation",
    status: "n/a",
    evidence: "Nothing responds to device motion.",
  },
  {
    id: "2.5.7",
    level: "AA",
    name: "Dragging Movements",
    status: "gate",
    new22: true,
    evidence:
      "The only draggable control is Slider, and browser/keyboard.spec.ts " +
      "asserts arrows, Home and End reach every value without dragging.",
  },
  {
    id: "2.5.8",
    level: "AA",
    name: "Target Size (Minimum)",
    status: "gate",
    new22: true,
    evidence:
      "--uix-control-* is max(24px, …), so no density setting can take a " +
      "control below the 24px floor; browser/density.spec.ts measures it.",
  },

  /* ------------------------------------------------------ Understandable */
  {
    id: "3.1.1",
    level: "A",
    name: "Language of Page",
    status: "product",
    evidence: "The lang attribute belongs to the document.",
  },
  {
    id: "3.1.2",
    level: "AA",
    name: "Language of Parts",
    status: "product",
    evidence:
      "A product mixing languages sets lang on the part. The strings table " +
      "makes that possible by keeping no English in the components.",
  },
  {
    id: "3.2.1",
    level: "A",
    name: "On Focus",
    status: "gate",
    evidence:
      "Tabs uses manual activation — focus moves, nothing changes until " +
      "Enter — and browser/keyboard.spec.ts asserts the selection does not " +
      "follow focus.",
  },
  {
    id: "3.2.2",
    level: "A",
    name: "On Input",
    status: "manual",
    evidence:
      "No component navigates or submits on change. A product wiring " +
      "onValueChange to a route change owes the warning.",
  },
  {
    id: "3.2.3",
    level: "AA",
    name: "Consistent Navigation",
    status: "product",
    evidence: "A site-level criterion.",
  },
  {
    id: "3.2.4",
    level: "AA",
    name: "Consistent Identification",
    status: "gate",
    evidence:
      "The API contract in api.spec.ts forces one shape across components " +
      "— one state triple, one polymorphism helper, one field wiring — so " +
      "the same function is not two different controls.",
  },
  {
    id: "3.2.6",
    level: "A",
    name: "Consistent Help",
    status: "product",
    new22: true,
    evidence:
      "Where help lives on a page is the product's decision; the library " +
      "supplies the hint slot.",
  },
  {
    id: "3.3.1",
    level: "A",
    name: "Error Identification",
    status: "gate",
    evidence:
      "Field sets aria-invalid whenever there is an error and points " +
      "aria-describedby at it; api.spec.ts requires all nine fields to " +
      "take the prop.",
  },
  {
    id: "3.3.2",
    level: "A",
    name: "Labels or Instructions",
    status: "gate",
    evidence:
      "label is required on every field, hint is available on every field, " +
      "and required is announced as a word rather than an asterisk.",
  },
  {
    id: "3.3.3",
    level: "AA",
    name: "Error Suggestion",
    status: "manual",
    evidence:
      "The library carries the message; whether it says what to do is the " +
      "caller's copy. No gate can read intent.",
  },
  {
    id: "3.3.4",
    level: "AA",
    name: "Error Prevention (Legal, Financial, Data)",
    status: "product",
    evidence:
      "Confirmation and reversal are flows, not components. Dialog is the " +
      "piece a product builds one from.",
  },
  {
    id: "3.3.7",
    level: "A",
    name: "Redundant Entry",
    status: "product",
    new22: true,
    evidence:
      "Whether a second step re-asks for the same thing is the product's " +
      "form design.",
  },
  {
    id: "3.3.8",
    level: "AA",
    name: "Accessible Authentication (Minimum)",
    status: "n/a",
    new22: true,
    evidence: "The library has no authentication surface.",
  },

  /* ------------------------------------------------------------- Robust */
  {
    id: "4.1.2",
    level: "A",
    name: "Name, Role, Value",
    status: "gate",
    evidence:
      "axe on every story in both themes, plus the role and description " +
      "assertions in browser/keyboard.spec.ts — which is where Tooltip was " +
      "found shipping neither a role nor an aria-describedby.",
  },
  {
    id: "4.1.3",
    level: "AA",
    name: "Status Messages",
    status: "gate",
    evidence:
      "Alert maps severity to role=status or role=alert, Toaster announces " +
      "in a live region, and Spinner carries a status role with text.",
  },
];
