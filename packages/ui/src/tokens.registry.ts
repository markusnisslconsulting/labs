/**
 * The machine-readable counterpart of styles/tokens/*.css.
 *
 * Everything a human can read there, a tool can read here: name,
 * value, tier and intent for every token. A parity test
 * (test/tokens.spec.ts) fails when this file and the CSS drift
 * apart, so code generators and AI assistants can trust it.
 *
 * Tiers:
 * - primitive  raw values; never referenced by components
 * - semantic   intent; the layer a product overrides to rebrand
 * - component  per-part override slots. These are deliberately NOT
 *              declared in CSS: each is referenced as
 *              var(--name, <semantic default>), so the slot costs
 *              nothing until a brand or product fills it. The value
 *              recorded here is that default.
 *
 * NOTE: kept prettier-ignored — the one-line-per-token layout is the
 * diff-friendly data format.
 */

export type TokenLevel = "primitive" | "semantic" | "component";
export type TokenType =
  | "color"
  | "radius"
  | "space"
  | "typography"
  | "density"
  | "elevation"
  | "motion"
  | "opacity"
  | "z-index";

export interface TokenDescriptor {
  name: string;
  value: string;
  level: TokenLevel;
  type: TokenType;
  description: string;
  /**
   * Marks a token as on its way out. Mirrors DTCG's `$deprecated`, so a
   * linter can warn on new uses and a report can list what still
   * references it — deprecation as data, not as a code comment.
   */
  deprecated?: string;
}

const t = (
  name: string,
  value: string,
  level: TokenLevel,
  type: TokenType,
  description: string,
  deprecated?: string,
): TokenDescriptor => ({
  name,
  value,
  level,
  type,
  description,
  ...(deprecated ? { deprecated } : {}),
});

/* Primitive ---------------------------------------------------------------- */

export const primitiveTokens: TokenDescriptor[] = [
  t("--uix-blue-600", "#1d4ed8", "primitive", "color", "Ocean brand accent"),
  t("--uix-blue-400", "#7aa5f7", "primitive", "color", "Ocean accent on dark surfaces"),
  t("--uix-red-600", "#b31234", "primitive", "color", "Brand accent red (AA on paper and under white)"),
  t("--uix-red-700", "#8f0e29", "primitive", "color", "Destructive red"),
  t("--uix-navy-900", "#172b4d", "primitive", "color", "Deep navy ink"),
  t("--uix-slate-600", "#4b5870", "primitive", "color", "Muted slate"),
  t("--uix-slate-500", "#5b6880", "primitive", "color", "Dimmed slate, disabled text on light"),
  t("--uix-grey-300", "#d5dbe6", "primitive", "color", "Hairline grey"),
  t("--uix-grey-100", "#e8eef6", "primitive", "color", "Quiet fill grey"),
  t("--uix-grey-25", "#f7f9fc", "primitive", "color", "Paper grey"),
  t("--uix-white", "#ffffff", "primitive", "color", "Pure white"),
  t("--uix-green-700", "#14691f", "primitive", "color", "Positive green"),
  t("--uix-amber-700", "#8a5a00", "primitive", "color", "Caution amber"),
  t("--uix-red-400", "#ff6b85", "primitive", "color", "Accent on dark surfaces"),
  t("--uix-green-400", "#63c47a", "primitive", "color", "Positive on dark surfaces"),
  t("--uix-amber-400", "#e2b04a", "primitive", "color", "Caution on dark surfaces"),
  t("--uix-grey-700", "#2c3a4f", "primitive", "color", "Dark border"),
  t("--uix-grey-800", "#1d2939", "primitive", "color", "Dark surface"),
  t("--uix-grey-900", "#101828", "primitive", "color", "Dark page"),
  t("--uix-slate-450", "#98a5b8", "primitive", "color", "Dimmed slate, disabled text on dark"),
  t("--uix-slate-400", "#a7b4c7", "primitive", "color", "Secondary text on dark"),
  t("--uix-font-sans", "\"Atkinson Hyperlegible\", -apple-system, \"Segoe UI\", Helvetica, Arial, sans-serif", "primitive", "typography", "Font sans"),
  t("--uix-font-mono", "ui-monospace, \"SF Mono\", Menlo, Consolas, monospace", "primitive", "typography", "Font mono"),
  t("--uix-font-size-100", "0.75rem", "primitive", "typography", "Caption size"),
  t("--uix-font-size-200", "0.875rem", "primitive", "typography", "Small size"),
  t("--uix-font-size-300", "1rem", "primitive", "typography", "Body size"),
  t("--uix-font-size-400", "1.15rem", "primitive", "typography", "Large body size"),
  t("--uix-font-size-500", "1.35rem", "primitive", "typography", "Heading size"),
  t("--uix-font-size-600", "1.75rem", "primitive", "typography", "Display size"),
  t("--uix-font-weight-regular", "400", "primitive", "typography", "Regular weight"),
  t("--uix-font-weight-bold", "700", "primitive", "typography", "Bold weight"),
  t("--uix-line-height-tight", "1.15", "primitive", "typography", "Heading line height"),
  t("--uix-line-height-normal", "1.55", "primitive", "typography", "Body line height"),
  t("--uix-radius-s", "0.5rem", "primitive", "radius", "Small radius"),
  t("--uix-radius-m", "0.7rem", "primitive", "radius", "Medium radius"),
  t("--uix-radius-l", "1rem", "primitive", "radius", "Large radius"),
  t("--uix-space-1", "0.25rem", "primitive", "space", "Quarter step"),
  t("--uix-space-2", "0.5rem", "primitive", "space", "Half step"),
  t("--uix-space-3", "0.75rem", "primitive", "space", "Base step"),
  t("--uix-space-4", "1rem", "primitive", "space", "One step"),
  t("--uix-space-5", "1.5rem", "primitive", "space", "Wide step"),
  t("--uix-space-6", "2.5rem", "primitive", "space", "Section step"),
  t("--uix-duration-fast", "120ms", "primitive", "motion", "Micro transitions"),
  t("--uix-duration-base", "200ms", "primitive", "motion", "Standard transitions"),
  t("--uix-duration-slow", "400ms", "primitive", "motion", "Large surfaces"),
  t("--uix-ease-out", "cubic-bezier(0.16, 1, 0.3, 1)", "primitive", "motion", "Standard easing"),
];

/* Semantic ----------------------------------------------------------------- */

export const semanticTokens: TokenDescriptor[] = [
  t("--uix-text-primary", "light-dark(var(--uix-navy-900), var(--uix-grey-25))", "semantic", "color", "Primary text"),
  t("--uix-text-secondary", "light-dark(var(--uix-slate-600), var(--uix-slate-400))", "semantic", "color", "Secondary text"),
  t("--uix-text-disabled", "light-dark(var(--uix-slate-500), var(--uix-slate-450))", "semantic", "color", "Text belonging to an unavailable control"),
  t("--uix-text-on-accent", "light-dark(var(--uix-white), var(--uix-grey-900))", "semantic", "color", "Text on accent fills"),
  t("--uix-bg-page", "light-dark(var(--uix-grey-25), var(--uix-grey-900))", "semantic", "color", "Page background"),
  t("--uix-bg-surface", "light-dark(var(--uix-white), var(--uix-grey-800))", "semantic", "color", "Surface background"),
  t("--uix-bg-subtle", "light-dark(var(--uix-grey-100), var(--uix-grey-700))", "semantic", "color", "Subtle fills: chips, code"),
  t("--uix-border-subtle", "light-dark(var(--uix-grey-300), var(--uix-grey-700))", "semantic", "color", "Hairline borders"),
  t("--uix-border-strong", "light-dark(var(--uix-slate-600), var(--uix-slate-400))", "semantic", "color", "Emphasised borders"),
  t("--uix-accent", "light-dark(var(--uix-red-600), var(--uix-red-400))", "semantic", "color", "Brand accent (ocean brand overrides to blue)"),
  t("--uix-accent-soft", "color-mix(in srgb, var(--uix-accent) 16%, transparent)", "semantic", "color", "Accent washes"),
  t("--uix-focus-ring", "var(--uix-accent)", "semantic", "color", "Keyboard focus indicator"),
  t("--uix-status-ok", "light-dark(var(--uix-green-700), var(--uix-green-400))", "semantic", "color", "Positive status"),
  t("--uix-status-warn", "light-dark(var(--uix-amber-700), var(--uix-amber-400))", "semantic", "color", "Caution status"),
  t("--uix-status-off", "light-dark(var(--uix-slate-600), var(--uix-slate-400))", "semantic", "color", "Neutral or absent status"),
  t("--uix-status-danger", "light-dark(var(--uix-red-700), var(--uix-red-400))", "semantic", "color", "Destructive status"),
  t("--uix-info", "light-dark(var(--uix-navy-900), var(--uix-slate-400))", "semantic", "color", "Informational intent"),
  t("--uix-opacity-disabled", "0.55", "semantic", "opacity", "Disabled controls"),
  t("--uix-gap-xs", "calc(var(--uix-space-1) * var(--uix-density))", "semantic", "space", "Density-scaled quarter step"),
  t("--uix-gap-sm", "calc(var(--uix-space-2) * var(--uix-density))", "semantic", "space", "Density-scaled half step"),
  t("--uix-gap-md", "calc(var(--uix-space-3) * var(--uix-density))", "semantic", "space", "Density-scaled base step"),
  t("--uix-gap-lg", "calc(var(--uix-space-4) * var(--uix-density))", "semantic", "space", "Density-scaled single step"),
  t("--uix-gap-xl", "calc(var(--uix-space-5) * var(--uix-density))", "semantic", "space", "Density-scaled wide step"),
  t("--uix-gap-2xl", "calc(var(--uix-space-6) * var(--uix-density))", "semantic", "space", "Density-scaled widest step"),
  t("--uix-ink", "light-dark(var(--uix-navy-900), var(--uix-grey-25))", "semantic", "color", "Strongest ink for this theme; mix toward it to deepen a fill"),
  t("--uix-paper", "light-dark(var(--uix-white), var(--uix-grey-900))", "semantic", "color", "Brightest surface for this theme; mix toward it to lighten a fill"),
  t("--uix-surface-inverse", "var(--uix-ink)", "semantic", "color", "Inverted surface (dark on light, light on dark)"),
  t("--uix-text-on-inverse", "var(--uix-paper)", "semantic", "color", "Text on an inverted surface"),
  t("--uix-control-sm", "max(24px, calc(2rem * var(--uix-density)))", "semantic", "space", "Small control height"),
  t("--uix-control-md", "max(24px, calc(2.5rem * var(--uix-density)))", "semantic", "space", "Default control height: buttons, fields, steppers"),
  t("--uix-control-lg", "max(24px, calc(3rem * var(--uix-density)))", "semantic", "space", "Large control height"),
  t("--uix-radius-inset", "var(--uix-radius-s)", "semantic", "radius", "A shape inside another shape"),
  t("--uix-radius-control", "var(--uix-radius-m)", "semantic", "radius", "An interactive box"),
  t("--uix-radius-surface", "var(--uix-radius-m)", "semantic", "radius", "A floating or banded surface"),
  t("--uix-radius-container", "var(--uix-radius-l)", "semantic", "radius", "A container that holds content"),
  t("--uix-radius-pill", "999px", "semantic", "radius", "Fully rounded by brand decision, not by geometry"),
  t("--uix-font-body", "var(--uix-font-sans)", "semantic", "typography", "Running text"),
  t("--uix-font-display", "var(--uix-font-sans)", "semantic", "typography", "Headings"),
  t("--uix-font-code", "var(--uix-font-mono)", "semantic", "typography", "Code and other fixed-width text"),
  t("--uix-elevation-raised", "0 1px 3px light-dark(rgba(16, 24, 40, 0.1), rgba(0, 0, 0, 0.5))", "semantic", "elevation", "Lifted off the page"),
  t("--uix-elevation-overlay", "0 8px 20px light-dark(rgba(16, 24, 40, 0.12), rgba(0, 0, 0, 0.45))", "semantic", "elevation", "Floating above the page"),
  t("--uix-elevation-modal", "0 18px 45px light-dark(rgba(16, 24, 40, 0.2), rgba(0, 0, 0, 0.6))", "semantic", "elevation", "Above everything"),
  t("--uix-text-body", "var(--uix-font-size-300)", "semantic", "typography", "Body text role"),
  t("--uix-text-heading", "var(--uix-font-size-500)", "semantic", "typography", "Heading text role"),
  t("--uix-text-caption", "var(--uix-font-size-100)", "semantic", "typography", "Caption text role"),
  t("--uix-text-ui", "var(--uix-font-size-200)", "semantic", "typography", "Small UI text role: nav, meta, card chrome"),
  t("--uix-container-info", "color-mix( in srgb, var(--uix-info) 10%, var(--uix-bg-surface) )", "semantic", "color", "Info container tint"),
  t("--uix-container-success", "color-mix( in srgb, var(--uix-status-ok) 12%, var(--uix-bg-surface) )", "semantic", "color", "Success container tint"),
  t("--uix-container-warning", "color-mix( in srgb, var(--uix-status-warn) 14%, var(--uix-bg-surface) )", "semantic", "color", "Warning container tint"),
  t("--uix-container-danger", "color-mix( in srgb, var(--uix-status-danger) 10%, var(--uix-bg-surface) )", "semantic", "color", "Danger container tint"),
  t("--uix-z-dropdown", "100", "semantic", "z-index", "Menus"),
  t(
    "--uix-z-popover",
    "150",
    "semantic",
    "z-index",
    "Popovers",
    "Redundant since Menu and Popover share one positioner, so there is no second layer to name. Use --uix-z-dropdown.",
  ),
  t("--uix-z-modal", "200", "semantic", "z-index", "Dialogs"),
  t("--uix-z-toast", "300", "semantic", "z-index", "Toasts"),
  t("--uix-z-tooltip", "400", "semantic", "z-index", "Tooltips"),
  t("--uix-density", "1", "semantic", "density", "Spacing multiplier; data-density=compact sets 0.72"),
];

/* Component (override slots; see the note above) ---------------------------- */

export const componentTokens: TokenDescriptor[] = [
  t("--uix-button-accent-bg", "var(--uix-accent)", "component", "color", "Solid button background, accent tone"),
  t("--uix-button-accent-fg", "var(--uix-text-on-accent)", "component", "color", "Solid button label, accent tone"),
  t("--uix-button-ghost-fg", "var(--uix-text-primary)", "component", "color", "Ghost button label"),
  t("--uix-button-ghost-hover-bg", "var(--uix-bg-subtle)", "component", "color", "Ghost button hover surface"),
  t("--uix-button-neutral-bg", "var(--uix-surface-inverse)", "component", "color", "Solid button background, neutral tone"),
  t("--uix-button-neutral-fg", "var(--uix-text-on-inverse)", "component", "color", "Solid button label, neutral tone"),
  t("--uix-button-outline-bg", "var(--uix-bg-surface)", "component", "color", "Outline button background"),
  t("--uix-button-outline-border", "var(--uix-border-subtle)", "component", "color", "Outline button border, rest"),
  t("--uix-button-outline-border-strong", "var(--uix-border-strong)", "component", "color", "Button outline border strong"),
  t("--uix-button-outline-fg", "var(--uix-text-primary)", "component", "color", "Outline button label"),
  t("--uix-button-radius", "var(--uix-radius-control)", "component", "radius", "Button corner radius, md"),
  t("--uix-chip-active-bg", "var(--uix-surface-inverse)", "component", "color", "Active chip background"),
  t("--uix-chip-active-fg", "var(--uix-text-on-inverse)", "component", "color", "Active chip label"),
  t("--uix-chip-bg", "var(--uix-bg-subtle)", "component", "color", "Chip background"),
  t("--uix-chip-fg", "var(--uix-text-secondary)", "component", "color", "Chip label"),
  t("--uix-field-pad-y", "0", "component", "space", "Extra vertical padding inside a field; height comes from --uix-control-md"),
  t("--uix-field-radius", "var(--uix-radius-control)", "component", "radius", "Field corner radius"),
  t("--uix-panel-accent", "var(--uix-accent)", "component", "color", "Panel label dot"),
  t("--uix-panel-bg", "var(--uix-bg-surface)", "component", "color", "Panel background"),
  t("--uix-panel-border", "var(--uix-border-subtle)", "component", "color", "Panel border"),
  t("--uix-panel-pad-x", "var(--uix-gap-xl)", "component", "space", "Panel horizontal padding, density-aware"),
  t("--uix-panel-pad-y", "calc(var(--uix-gap-lg) + var(--uix-gap-xs))", "component", "space", "Panel vertical padding, density-aware"),
  t("--uix-panel-radius", "var(--uix-radius-container)", "component", "radius", "Panel corner radius"),
  t("--uix-pill-fg", "var(--uix-text-primary)", "component", "color", "Status pill label"),
  t("--uix-pill-off", "var(--uix-status-off)", "component", "color", "Status pill dot, off"),
  t("--uix-pill-ok", "var(--uix-status-ok)", "component", "color", "Status pill dot, ok"),
  t("--uix-pill-warn", "var(--uix-status-warn)", "component", "color", "Status pill dot, warn"),
  t("--uix-switch-track-bg", "var(--uix-bg-subtle)", "component", "color", "Switch track, off"),
  t("--uix-switch-track-on-bg", "var(--uix-accent)", "component", "color", "Switch track, on"),
  t("--uix-switch-thumb-bg", "var(--uix-bg-surface)", "component", "color", "Switch knob"),
  t("--uix-switch-travel", "1.3rem", "component", "space", "How far the knob travels; negated under dir=rtl"),
  t("--uix-search-border", "var(--uix-border-subtle)", "component", "color", "Search input border"),
];

export const allTokens: TokenDescriptor[] = [
  ...primitiveTokens,
  ...semanticTokens,
  ...componentTokens,
];
