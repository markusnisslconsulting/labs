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
 *              SearchInput
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

const token = (
  name: string,
  value: string,
  level: TokenLevel,
  type: TokenType,
  description: string,
): TokenDescriptor => ({ name, value, level, type, description });

export const primitiveTokens: TokenDescriptor[] = [
  token("--uix-red-600", "#e5173f", "primitive", "color", "Brand accent red"),
  token("--uix-navy-900", "#172b4d", "primitive", "color", "Deep navy ink"),
  token("--uix-slate-600", "#4b5870", "primitive", "color", "Muted slate"),
  token("--uix-grey-300", "#d5dbe6", "primitive", "color", "Hairline grey"),
  token("--uix-grey-100", "#e8eef6", "primitive", "color", "Quiet fill grey"),
  token("--uix-grey-25", "#f7f9fc", "primitive", "color", "Paper grey"),
  token("--uix-white", "#ffffff", "primitive", "color", "Pure white"),
  token("--uix-green-700", "#14691f", "primitive", "color", "Positive green"),
  token("--uix-amber-700", "#8a5a00", "primitive", "color", "Caution amber"),
  token(
    "--uix-radius-s",
    "0.5rem",
    "primitive",
    "radius",
    "Small radius (chips, mini buttons)",
  ),
  token(
    "--uix-radius-m",
    "0.7rem",
    "primitive",
    "radius",
    "Medium radius (buttons)",
  ),
  token(
    "--uix-radius-l",
    "1rem",
    "primitive",
    "radius",
    "Large radius (panels)",
  ),
  token("--uix-space-1", "0.25rem", "primitive", "space", "Quarter step"),
  token("--uix-space-2", "0.5rem", "primitive", "space", "Half step"),
  token("--uix-space-3", "0.75rem", "primitive", "space", "Base step"),
  token("--uix-space-4", "1rem", "primitive", "space", "One step"),
  token("--uix-space-5", "1.5rem", "primitive", "space", "Wide step"),
  token("--uix-space-6", "2.5rem", "primitive", "space", "Section step"),
];

export const semanticTokens: TokenDescriptor[] = [
  token(
    "--uix-text-primary",
    "var(--uix-navy-900)",
    "semantic",
    "color",
    "Primary text",
  ),
  token(
    "--uix-text-secondary",
    "var(--uix-slate-600)",
    "semantic",
    "color",
    "Secondary text",
  ),
  token(
    "--uix-text-on-accent",
    "var(--uix-white)",
    "semantic",
    "color",
    "Text on accent fills",
  ),
  token(
    "--uix-bg-page",
    "var(--uix-grey-25)",
    "semantic",
    "color",
    "Page background",
  ),
  token(
    "--uix-bg-surface",
    "var(--uix-white)",
    "semantic",
    "color",
    "Surface background",
  ),
  token(
    "--uix-bg-subtle",
    "var(--uix-grey-100)",
    "semantic",
    "color",
    "Subtle fills: chips, code",
  ),
  token(
    "--uix-border-subtle",
    "var(--uix-grey-300)",
    "semantic",
    "color",
    "Hairline borders",
  ),
  token(
    "--uix-border-strong",
    "var(--uix-slate-600)",
    "semantic",
    "color",
    "Emphasised borders, outline hover",
  ),
  token(
    "--uix-accent",
    "var(--uix-red-600)",
    "semantic",
    "color",
    "Brand accent",
  ),
  token(
    "--uix-accent-soft",
    "rgba(229, 23, 63, 0.18)",
    "semantic",
    "color",
    "Accent highlight washes",
  ),
  token(
    "--uix-focus-ring",
    "var(--uix-accent)",
    "semantic",
    "color",
    "Keyboard focus indicator",
  ),
  token(
    "--uix-status-ok",
    "var(--uix-green-700)",
    "semantic",
    "color",
    "Positive status",
  ),
  token(
    "--uix-status-warn",
    "var(--uix-amber-700)",
    "semantic",
    "color",
    "Caution status",
  ),
  token(
    "--uix-status-off",
    "var(--uix-slate-600)",
    "semantic",
    "color",
    "Neutral or absent status",
  ),
];

export const componentTokens: TokenDescriptor[] = [
  token(
    "--uix-button-accent-bg",
    "var(--uix-accent)",
    "component",
    "color",
    "Solid button background, accent tone",
  ),
  token(
    "--uix-button-accent-fg",
    "var(--uix-text-on-accent)",
    "component",
    "color",
    "Solid button label, accent tone",
  ),
  token(
    "--uix-button-neutral-bg",
    "var(--uix-navy-900)",
    "component",
    "color",
    "Solid button background, neutral tone",
  ),
  token(
    "--uix-button-neutral-fg",
    "var(--uix-white)",
    "component",
    "color",
    "Solid button label, neutral tone",
  ),
  token(
    "--uix-button-outline-bg",
    "var(--uix-bg-surface)",
    "component",
    "color",
    "Outline button background",
  ),
  token(
    "--uix-button-outline-fg",
    "var(--uix-text-primary)",
    "component",
    "color",
    "Outline button label",
  ),
  token(
    "--uix-button-outline-border",
    "var(--uix-border-subtle)",
    "component",
    "color",
    "Outline button border, rest state",
  ),
  token(
    "--uix-button-outline-border-strong",
    "var(--uix-border-strong)",
    "component",
    "color",
    "Outline button border, hover",
  ),
  token(
    "--uix-button-ghost-fg",
    "var(--uix-text-primary)",
    "component",
    "color",
    "Ghost button label",
  ),
  token(
    "--uix-button-ghost-hover-bg",
    "var(--uix-bg-subtle)",
    "component",
    "color",
    "Ghost button hover surface",
  ),
  token(
    "--uix-button-radius",
    "var(--uix-radius-m)",
    "component",
    "radius",
    "Button corner radius, md size",
  ),
  token(
    "--uix-chip-bg",
    "var(--uix-bg-subtle)",
    "component",
    "color",
    "Chip background",
  ),
  token(
    "--uix-chip-fg",
    "var(--uix-text-secondary)",
    "component",
    "color",
    "Chip label",
  ),
  token(
    "--uix-chip-active-bg",
    "var(--uix-navy-900)",
    "component",
    "color",
    "Active chip background",
  ),
  token(
    "--uix-chip-active-fg",
    "var(--uix-white)",
    "component",
    "color",
    "Active chip label",
  ),
  token(
    "--uix-pill-fg",
    "var(--uix-text-primary)",
    "component",
    "color",
    "Status pill label",
  ),
  token(
    "--uix-pill-ok",
    "var(--uix-status-ok)",
    "component",
    "color",
    "Status pill dot, ok",
  ),
  token(
    "--uix-pill-warn",
    "var(--uix-status-warn)",
    "component",
    "color",
    "Status pill dot, warn",
  ),
  token(
    "--uix-pill-off",
    "var(--uix-status-off)",
    "component",
    "color",
    "Status pill dot, off",
  ),
  token(
    "--uix-panel-bg",
    "var(--uix-bg-surface)",
    "component",
    "color",
    "Panel background",
  ),
  token(
    "--uix-panel-border",
    "var(--uix-border-subtle)",
    "component",
    "color",
    "Panel border",
  ),
  token(
    "--uix-panel-radius",
    "var(--uix-radius-l)",
    "component",
    "radius",
    "Panel corner radius",
  ),
  token(
    "--uix-panel-accent",
    "var(--uix-accent)",
    "component",
    "color",
    "Panel label dot",
  ),
  token(
    "--uix-panel-pad-x",
    "var(--uix-space-5)",
    "component",
    "space",
    "Panel horizontal padding",
  ),
  token(
    "--uix-panel-pad-y",
    "var(--uix-space-5)",
    "component",
    "space",
    "Panel vertical padding",
  ),
  token(
    "--uix-search-border",
    "var(--uix-border-subtle)",
    "component",
    "color",
    "Search input border",
  ),
];

export const allTokens: TokenDescriptor[] = [
  ...primitiveTokens,
  ...semanticTokens,
  ...componentTokens,
];
