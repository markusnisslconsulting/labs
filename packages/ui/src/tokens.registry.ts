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
 * - component  per-part bindings for Button, Chip, StatusPill, Panel,
 *              SearchInput, Field
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
  | "density";

export interface TokenDescriptor {
  name: string;
  value: string;
  level: TokenLevel;
  type: TokenType;
  description: string;
}

const t = (
  name: string,
  value: string,
  level: TokenLevel,
  type: TokenType,
  description: string,
): TokenDescriptor => ({ name, value, level, type, description });

/* Primitive ---------------------------------------------------------------- */

export const primitiveTokens: TokenDescriptor[] = [
  t("--uix-red-600", "#b31234", "primitive", "color", "Brand accent red (AA on paper and under white)"),
  t("--uix-red-700", "#8f0e29", "primitive", "color", "Destructive red"),
  t("--uix-red-400", "#ff6b85", "primitive", "color", "Accent on dark surfaces"),
  t("--uix-navy-900", "#172b4d", "primitive", "color", "Deep navy ink"),
  t("--uix-slate-600", "#4b5870", "primitive", "color", "Muted slate"),
  t("--uix-slate-400", "#a7b4c7", "primitive", "color", "Secondary text on dark"),
  t("--uix-grey-300", "#d5dbe6", "primitive", "color", "Hairline grey"),
  t("--uix-grey-100", "#e8eef6", "primitive", "color", "Quiet fill grey"),
  t("--uix-grey-25", "#f7f9fc", "primitive", "color", "Paper grey"),
  t("--uix-grey-700", "#2c3a4f", "primitive", "color", "Dark border"),
  t("--uix-grey-800", "#1d2939", "primitive", "color", "Dark surface"),
  t("--uix-grey-900", "#101828", "primitive", "color", "Dark page"),
  t("--uix-white", "#ffffff", "primitive", "color", "Pure white"),
  t("--uix-green-700", "#14691f", "primitive", "color", "Positive green"),
  t("--uix-green-400", "#63c47a", "primitive", "color", "Positive on dark surfaces"),
  t("--uix-amber-700", "#8a5a00", "primitive", "color", "Caution amber"),
  t("--uix-amber-400", "#e2b04a", "primitive", "color", "Caution on dark surfaces"),
  t("--uix-radius-s", "0.5rem", "primitive", "radius", "Small radius"),
  t("--uix-radius-m", "0.7rem", "primitive", "radius", "Medium radius"),
  t("--uix-radius-l", "1rem", "primitive", "radius", "Large radius"),
  t("--uix-space-1", "0.25rem", "primitive", "space", "Quarter step"),
  t("--uix-space-2", "0.5rem", "primitive", "space", "Half step"),
  t("--uix-space-3", "0.75rem", "primitive", "space", "Base step"),
  t("--uix-space-4", "1rem", "primitive", "space", "One step"),
  t("--uix-space-5", "1.5rem", "primitive", "space", "Wide step"),
  t("--uix-space-6", "2.5rem", "primitive", "space", "Section step"),
  t("--uix-font-sans", '"Atkinson Hyperlegible", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif', "primitive", "typography", "UI font family"),
  t("--uix-font-mono", 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', "primitive", "typography", "Code font family"),
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
];

/* Semantic ----------------------------------------------------------------- */

export const semanticTokens: TokenDescriptor[] = [
  t("--uix-text-primary", "var(--uix-navy-900)", "semantic", "color", "Primary text"),
  t("--uix-text-secondary", "var(--uix-slate-600)", "semantic", "color", "Secondary text"),
  t("--uix-text-on-accent", "var(--uix-white)", "semantic", "color", "Text on accent fills"),
  t("--uix-bg-page", "var(--uix-grey-25)", "semantic", "color", "Page background"),
  t("--uix-bg-surface", "var(--uix-white)", "semantic", "color", "Surface background"),
  t("--uix-bg-subtle", "var(--uix-grey-100)", "semantic", "color", "Subtle fills: chips, code"),
  t("--uix-border-subtle", "var(--uix-grey-300)", "semantic", "color", "Hairline borders"),
  t("--uix-border-strong", "var(--uix-slate-600)", "semantic", "color", "Emphasised borders"),
  t("--uix-accent", "var(--uix-red-600)", "semantic", "color", "Brand accent"),
  t("--uix-accent-soft", "rgba(179, 18, 52, 0.16)", "semantic", "color", "Accent washes"),
  t("--uix-focus-ring", "var(--uix-accent)", "semantic", "color", "Keyboard focus indicator"),
  t("--uix-status-ok", "var(--uix-green-700)", "semantic", "color", "Positive status"),
  t("--uix-status-warn", "var(--uix-amber-700)", "semantic", "color", "Caution status"),
  t("--uix-status-danger", "var(--uix-red-700)", "semantic", "color", "Destructive status"),
  t("--uix-status-off", "var(--uix-slate-600)", "semantic", "color", "Neutral or absent status"),
  t("--uix-info", "var(--uix-navy-900)", "semantic", "color", "Informational intent"),
  t("--uix-density", "1", "semantic", "density", "Spacing multiplier; data-density=compact sets 0.72"),
];

/* Component ---------------------------------------------------------------- */

export const componentTokens: TokenDescriptor[] = [
  t("--uix-button-accent-bg", "var(--uix-accent)", "component", "color", "Solid button background, accent tone"),
  t("--uix-button-accent-fg", "var(--uix-text-on-accent)", "component", "color", "Solid button label, accent tone"),
  t("--uix-button-neutral-bg", "var(--uix-navy-900)", "component", "color", "Solid button background, neutral tone"),
  t("--uix-button-neutral-fg", "var(--uix-white)", "component", "color", "Solid button label, neutral tone"),
  t("--uix-button-outline-bg", "var(--uix-bg-surface)", "component", "color", "Outline button background"),
  t("--uix-button-outline-fg", "var(--uix-text-primary)", "component", "color", "Outline button label"),
  t("--uix-button-outline-border", "var(--uix-border-subtle)", "component", "color", "Outline button border, rest"),
  t("--uix-button-outline-border-strong", "var(--uix-border-strong)", "component", "color", "Outline button border, hover"),
  t("--uix-button-ghost-fg", "var(--uix-text-primary)", "component", "color", "Ghost button label"),
  t("--uix-button-ghost-hover-bg", "var(--uix-bg-subtle)", "component", "color", "Ghost button hover surface"),
  t("--uix-button-radius", "var(--uix-radius-m)", "component", "radius", "Button corner radius, md"),
  t("--uix-chip-bg", "var(--uix-bg-subtle)", "component", "color", "Chip background"),
  t("--uix-chip-fg", "var(--uix-text-secondary)", "component", "color", "Chip label"),
  t("--uix-chip-active-bg", "var(--uix-navy-900)", "component", "color", "Active chip background"),
  t("--uix-chip-active-fg", "var(--uix-white)", "component", "color", "Active chip label"),
  t("--uix-pill-fg", "var(--uix-text-primary)", "component", "color", "Status pill label"),
  t("--uix-pill-ok", "var(--uix-status-ok)", "component", "color", "Status pill dot, ok"),
  t("--uix-pill-warn", "var(--uix-status-warn)", "component", "color", "Status pill dot, warn"),
  t("--uix-pill-off", "var(--uix-status-off)", "component", "color", "Status pill dot, off"),
  t("--uix-panel-bg", "var(--uix-bg-surface)", "component", "color", "Panel background"),
  t("--uix-panel-border", "var(--uix-border-subtle)", "component", "color", "Panel border"),
  t("--uix-panel-radius", "var(--uix-radius-l)", "component", "radius", "Panel corner radius"),
  t("--uix-panel-accent", "var(--uix-accent)", "component", "color", "Panel label dot"),
  t("--uix-panel-pad-x", "calc(var(--uix-space-5) * var(--uix-density))", "component", "space", "Panel horizontal padding, density-aware"),
  t("--uix-panel-pad-y", "calc(var(--uix-space-4) * var(--uix-density) + var(--uix-space-1))", "component", "space", "Panel vertical padding, density-aware"),
  t("--uix-search-border", "var(--uix-border-subtle)", "component", "color", "Search input border"),
  t("--uix-field-radius", "var(--uix-radius-m)", "component", "radius", "Field corner radius"),
  t("--uix-field-pad-y", "calc(var(--uix-space-2) * var(--uix-density))", "component", "space", "Field vertical padding, density-aware"),
];

export const allTokens: TokenDescriptor[] = [
  ...primitiveTokens,
  ...semanticTokens,
  ...componentTokens,
];
