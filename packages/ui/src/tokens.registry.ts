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
 */

export type TokenLevel = "primitive" | "semantic" | "component";
export type TokenType = "color" | "radius" | "space";

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
  t(
    "--uix-red-600",
    "#b31234",
    "primitive",
    "color",
    "Brand accent red (AA on paper and under white)",
  ),
  t("--uix-red-700", "#8f0e29", "primitive", "color", "Destructive red"),
  t("--uix-navy-900", "#172b4d", "primitive", "color", "Deep navy ink"),
  t("--uix-slate-600", "#4b5870", "primitive", "color", "Muted slate"),
  t("--uix-grey-300", "#d5dbe6", "primitive", "color", "Hairline grey"),
  t("--uix-grey-100", "#e8eef6", "primitive", "color", "Quiet fill grey"),
  t("--uix-grey-25", "#f7f9fc", "primitive", "color", "Paper grey"),
  t("--uix-white", "#ffffff", "primitive", "color", "Pure white"),
  t("--uix-green-700", "#14691f", "primitive", "color", "Positive green"),
  t("--uix-amber-700", "#8a5a00", "primitive", "color", "Caution amber"),
  t("--uix-radius-s", "0.5rem", "primitive", "radius", "Small radius"),
  t("--uix-radius-m", "0.7rem", "primitive", "radius", "Medium radius"),
  t("--uix-radius-l", "1rem", "primitive", "radius", "Large radius"),
  t("--uix-space-1", "0.25rem", "primitive", "space", "Quarter step"),
  t("--uix-space-2", "0.5rem", "primitive", "space", "Half step"),
  t("--uix-space-3", "0.75rem", "primitive", "space", "Base step"),
  t("--uix-space-4", "1rem", "primitive", "space", "One step"),
  t("--uix-space-5", "1.5rem", "primitive", "space", "Wide step"),
  t("--uix-space-6", "2.5rem", "primitive", "space", "Section step"),
];

/* Semantic ----------------------------------------------------------------- */

export const semanticTokens: TokenDescriptor[] = [
  t(
    "--uix-text-primary",
    "var(--uix-navy-900)",
    "semantic",
    "color",
    "Primary text",
  ),
  t(
    "--uix-text-secondary",
    "var(--uix-slate-600)",
    "semantic",
    "color",
    "Secondary text",
  ),
  t(
    "--uix-text-on-accent",
    "var(--uix-white)",
    "semantic",
    "color",
    "Text on accent fills",
  ),
  t(
    "--uix-bg-page",
    "var(--uix-grey-25)",
    "semantic",
    "color",
    "Page background",
  ),
  t(
    "--uix-bg-surface",
    "var(--uix-white)",
    "semantic",
    "color",
    "Surface background",
  ),
  t(
    "--uix-bg-subtle",
    "var(--uix-grey-100)",
    "semantic",
    "color",
    "Subtle fills: chips, code",
  ),
  t(
    "--uix-border-subtle",
    "var(--uix-grey-300)",
    "semantic",
    "color",
    "Hairline borders",
  ),
  t(
    "--uix-border-strong",
    "var(--uix-slate-600)",
    "semantic",
    "color",
    "Emphasised borders",
  ),
  t("--uix-accent", "var(--uix-red-600)", "semantic", "color", "Brand accent"),
  t(
    "--uix-accent-soft",
    "rgba(179, 18, 52, 0.16)",
    "semantic",
    "color",
    "Accent washes",
  ),
  t(
    "--uix-focus-ring",
    "var(--uix-accent)",
    "semantic",
    "color",
    "Keyboard focus indicator",
  ),
  t(
    "--uix-status-ok",
    "var(--uix-green-700)",
    "semantic",
    "color",
    "Positive status",
  ),
  t(
    "--uix-status-warn",
    "var(--uix-amber-700)",
    "semantic",
    "color",
    "Caution status",
  ),
  t(
    "--uix-status-danger",
    "var(--uix-red-700)",
    "semantic",
    "color",
    "Destructive status",
  ),
  t(
    "--uix-status-off",
    "var(--uix-slate-600)",
    "semantic",
    "color",
    "Neutral or absent status",
  ),
  t(
    "--uix-info",
    "var(--uix-navy-900)",
    "semantic",
    "color",
    "Informational intent",
  ),
];

/* Component ---------------------------------------------------------------- */

export const componentTokens: TokenDescriptor[] = [
  t(
    "--uix-button-accent-bg",
    "var(--uix-accent)",
    "component",
    "color",
    "Solid button background, accent tone",
  ),
  t(
    "--uix-button-accent-fg",
    "var(--uix-text-on-accent)",
    "component",
    "color",
    "Solid button label, accent tone",
  ),
  t(
    "--uix-button-neutral-bg",
    "var(--uix-navy-900)",
    "component",
    "color",
    "Solid button background, neutral tone",
  ),
  t(
    "--uix-button-neutral-fg",
    "var(--uix-white)",
    "component",
    "color",
    "Solid button label, neutral tone",
  ),
  t(
    "--uix-button-outline-bg",
    "var(--uix-bg-surface)",
    "component",
    "color",
    "Outline button background",
  ),
  t(
    "--uix-button-outline-fg",
    "var(--uix-text-primary)",
    "component",
    "color",
    "Outline button label",
  ),
  t(
    "--uix-button-outline-border",
    "var(--uix-border-subtle)",
    "component",
    "color",
    "Outline button border, rest",
  ),
  t(
    "--uix-button-outline-border-strong",
    "var(--uix-border-strong)",
    "component",
    "color",
    "Outline button border, hover",
  ),
  t(
    "--uix-button-ghost-fg",
    "var(--uix-text-primary)",
    "component",
    "color",
    "Ghost button label",
  ),
  t(
    "--uix-button-ghost-hover-bg",
    "var(--uix-bg-subtle)",
    "component",
    "color",
    "Ghost button hover surface",
  ),
  t(
    "--uix-button-radius",
    "var(--uix-radius-m)",
    "component",
    "radius",
    "Button corner radius, md",
  ),
  t(
    "--uix-chip-bg",
    "var(--uix-bg-subtle)",
    "component",
    "color",
    "Chip background",
  ),
  t(
    "--uix-chip-fg",
    "var(--uix-text-secondary)",
    "component",
    "color",
    "Chip label",
  ),
  t(
    "--uix-chip-active-bg",
    "var(--uix-navy-900)",
    "component",
    "color",
    "Active chip background",
  ),
  t(
    "--uix-chip-active-fg",
    "var(--uix-white)",
    "component",
    "color",
    "Active chip label",
  ),
  t(
    "--uix-pill-fg",
    "var(--uix-text-primary)",
    "component",
    "color",
    "Status pill label",
  ),
  t(
    "--uix-pill-ok",
    "var(--uix-status-ok)",
    "component",
    "color",
    "Status pill dot, ok",
  ),
  t(
    "--uix-pill-warn",
    "var(--uix-status-warn)",
    "component",
    "color",
    "Status pill dot, warn",
  ),
  t(
    "--uix-pill-off",
    "var(--uix-status-off)",
    "component",
    "color",
    "Status pill dot, off",
  ),
  t(
    "--uix-panel-bg",
    "var(--uix-bg-surface)",
    "component",
    "color",
    "Panel background",
  ),
  t(
    "--uix-panel-border",
    "var(--uix-border-subtle)",
    "component",
    "color",
    "Panel border",
  ),
  t(
    "--uix-panel-radius",
    "var(--uix-radius-l)",
    "component",
    "radius",
    "Panel corner radius",
  ),
  t(
    "--uix-panel-accent",
    "var(--uix-accent)",
    "component",
    "color",
    "Panel label dot",
  ),
  t(
    "--uix-panel-pad-x",
    "var(--uix-space-5)",
    "component",
    "space",
    "Panel horizontal padding",
  ),
  t(
    "--uix-panel-pad-y",
    "var(--uix-space-5)",
    "component",
    "space",
    "Panel vertical padding",
  ),
  t(
    "--uix-search-border",
    "var(--uix-border-subtle)",
    "component",
    "color",
    "Search input border",
  ),
  t(
    "--uix-field-radius",
    "var(--uix-radius-m)",
    "component",
    "radius",
    "Field corner radius",
  ),
];

export const allTokens: TokenDescriptor[] = [
  ...primitiveTokens,
  ...semanticTokens,
  ...componentTokens,
];
