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
 * - component  per-part bindings for Button, Chip, StatusPill, Panel
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

export const primitiveTokens: TokenDescriptor[] = [
  {
    name: "--uix-red-600",
    value: "#e5173f",
    level: "primitive",
    type: "color",
    description: "Brand accent red",
  },
  {
    name: "--uix-navy-900",
    value: "#172b4d",
    level: "primitive",
    type: "color",
    description: "Deep navy ink",
  },
  {
    name: "--uix-slate-600",
    value: "#4b5870",
    level: "primitive",
    type: "color",
    description: "Muted slate",
  },
  {
    name: "--uix-grey-300",
    value: "#d5dbe6",
    level: "primitive",
    type: "color",
    description: "Hairline grey",
  },
  {
    name: "--uix-grey-100",
    value: "#e8eef6",
    level: "primitive",
    type: "color",
    description: "Quiet fill grey",
  },
  {
    name: "--uix-grey-25",
    value: "#f7f9fc",
    level: "primitive",
    type: "color",
    description: "Paper grey",
  },
  {
    name: "--uix-white",
    value: "#ffffff",
    level: "primitive",
    type: "color",
    description: "Pure white",
  },
  {
    name: "--uix-green-700",
    value: "#14691f",
    level: "primitive",
    type: "color",
    description: "Positive green",
  },
  {
    name: "--uix-amber-700",
    value: "#8a5a00",
    level: "primitive",
    type: "color",
    description: "Caution amber",
  },
  {
    name: "--uix-radius-s",
    value: "0.5rem",
    level: "primitive",
    type: "radius",
    description: "Small radius (chips, mini buttons)",
  },
  {
    name: "--uix-radius-m",
    value: "0.7rem",
    level: "primitive",
    type: "radius",
    description: "Medium radius (buttons)",
  },
  {
    name: "--uix-radius-l",
    value: "1rem",
    level: "primitive",
    type: "radius",
    description: "Large radius (panels)",
  },
  {
    name: "--uix-space-1",
    value: "0.25rem",
    level: "primitive",
    type: "space",
    description: "Quarter step",
  },
  {
    name: "--uix-space-2",
    value: "0.5rem",
    level: "primitive",
    type: "space",
    description: "Half step",
  },
  {
    name: "--uix-space-3",
    value: "0.75rem",
    level: "primitive",
    type: "space",
    description: "Base step",
  },
  {
    name: "--uix-space-4",
    value: "1rem",
    level: "primitive",
    type: "space",
    description: "One step",
  },
  {
    name: "--uix-space-5",
    value: "1.5rem",
    level: "primitive",
    type: "space",
    description: "Wide step",
  },
  {
    name: "--uix-space-6",
    value: "2.5rem",
    level: "primitive",
    type: "space",
    description: "Section step",
  },
];

export const semanticTokens: TokenDescriptor[] = [
  {
    name: "--uix-text-primary",
    value: "var(--uix-navy-900)",
    level: "semantic",
    type: "color",
    description: "Primary text",
  },
  {
    name: "--uix-text-secondary",
    value: "var(--uix-slate-600)",
    level: "semantic",
    type: "color",
    description: "Secondary text",
  },
  {
    name: "--uix-text-on-accent",
    value: "var(--uix-white)",
    level: "semantic",
    type: "color",
    description: "Text on accent fills",
  },
  {
    name: "--uix-bg-page",
    value: "var(--uix-grey-25)",
    level: "semantic",
    type: "color",
    description: "Page background",
  },
  {
    name: "--uix-bg-surface",
    value: "var(--uix-white)",
    level: "semantic",
    type: "color",
    description: "Surface background",
  },
  {
    name: "--uix-bg-subtle",
    value: "var(--uix-grey-100)",
    level: "semantic",
    type: "color",
    description: "Subtle fills: chips, code",
  },
  {
    name: "--uix-border-subtle",
    value: "var(--uix-grey-300)",
    level: "semantic",
    type: "color",
    description: "Hairline borders",
  },
  {
    name: "--uix-accent",
    value: "var(--uix-red-600)",
    level: "semantic",
    type: "color",
    description: "Brand accent",
  },
  {
    name: "--uix-accent-soft",
    value: "rgba(229, 23, 63, 0.18)",
    level: "semantic",
    type: "color",
    description: "Accent highlight washes",
  },
  {
    name: "--uix-focus-ring",
    value: "var(--uix-accent)",
    level: "semantic",
    type: "color",
    description: "Keyboard focus indicator",
  },
  {
    name: "--uix-status-ok",
    value: "var(--uix-green-700)",
    level: "semantic",
    type: "color",
    description: "Positive status",
  },
  {
    name: "--uix-status-warn",
    value: "var(--uix-amber-700)",
    level: "semantic",
    type: "color",
    description: "Caution status",
  },
  {
    name: "--uix-status-off",
    value: "var(--uix-slate-600)",
    level: "semantic",
    type: "color",
    description: "Neutral or absent status",
  },
];

export const componentTokens: TokenDescriptor[] = [
  {
    name: "--uix-button-bg",
    value: "var(--uix-accent)",
    level: "component",
    type: "color",
    description: "Button background",
  },
  {
    name: "--uix-button-fg",
    value: "var(--uix-text-on-accent)",
    level: "component",
    type: "color",
    description: "Button label",
  },
  {
    name: "--uix-button-ghost-bg",
    value: "var(--uix-bg-surface)",
    level: "component",
    type: "color",
    description: "Ghost button background",
  },
  {
    name: "--uix-button-ghost-fg",
    value: "var(--uix-text-primary)",
    level: "component",
    type: "color",
    description: "Ghost button label",
  },
  {
    name: "--uix-button-ghost-border",
    value: "var(--uix-border-subtle)",
    level: "component",
    type: "color",
    description: "Ghost button border",
  },
  {
    name: "--uix-button-radius",
    value: "var(--uix-radius-m)",
    level: "component",
    type: "radius",
    description: "Button corner radius",
  },
  {
    name: "--uix-chip-bg",
    value: "var(--uix-bg-subtle)",
    level: "component",
    type: "color",
    description: "Chip background",
  },
  {
    name: "--uix-chip-fg",
    value: "var(--uix-text-secondary)",
    level: "component",
    type: "color",
    description: "Chip label",
  },
  {
    name: "--uix-chip-active-bg",
    value: "var(--uix-navy-900)",
    level: "component",
    type: "color",
    description: "Active chip background",
  },
  {
    name: "--uix-chip-active-fg",
    value: "var(--uix-white)",
    level: "component",
    type: "color",
    description: "Active chip label",
  },
  {
    name: "--uix-pill-fg",
    value: "var(--uix-text-primary)",
    level: "component",
    type: "color",
    description: "Status pill label",
  },
  {
    name: "--uix-pill-ok",
    value: "var(--uix-status-ok)",
    level: "component",
    type: "color",
    description: "Status pill dot, ok",
  },
  {
    name: "--uix-pill-warn",
    value: "var(--uix-status-warn)",
    level: "component",
    type: "color",
    description: "Status pill dot, warn",
  },
  {
    name: "--uix-pill-off",
    value: "var(--uix-status-off)",
    level: "component",
    type: "color",
    description: "Status pill dot, off",
  },
  {
    name: "--uix-panel-bg",
    value: "var(--uix-bg-surface)",
    level: "component",
    type: "color",
    description: "Panel background",
  },
  {
    name: "--uix-panel-border",
    value: "var(--uix-border-subtle)",
    level: "component",
    type: "color",
    description: "Panel border",
  },
  {
    name: "--uix-panel-radius",
    value: "var(--uix-radius-l)",
    level: "component",
    type: "radius",
    description: "Panel corner radius",
  },
  {
    name: "--uix-panel-accent",
    value: "var(--uix-accent)",
    level: "component",
    type: "color",
    description: "Panel label dot",
  },
  {
    name: "--uix-panel-pad-x",
    value: "var(--uix-space-5)",
    level: "component",
    type: "space",
    description: "Panel horizontal padding",
  },
  {
    name: "--uix-panel-pad-y",
    value: "var(--uix-space-5)",
    level: "component",
    type: "space",
    description: "Panel vertical padding",
  },
];

export const allTokens: TokenDescriptor[] = [
  ...primitiveTokens,
  ...semanticTokens,
  ...componentTokens,
];
