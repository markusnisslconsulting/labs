const fonts = {
  body: '"Atkinson Hyperlegible", "Segoe UI", Helvetica, Arial, sans-serif',
  display: '"Bricolage Grotesque", "Avenir Next", "Segoe UI", sans-serif',
} as const;

const palette = {
  paper: "#f5f6f8",
  field: "#e8eef6",
  navy: "#172b4d",
  muted: "#4b5870",
  rule: "#d5dbe6",
  red: "#e5173f",
  redText: "#c41235",
  redSoft: "#fde6eb",
  redOnDark: "#ff6b83",
} as const;

/** Brand identity and the existing Labs accessibility mapping. */
export const consulting = {
  fonts,
  palette,
  labs: {
    page: { light: "#f7f9fc", dark: "#101828" },
    surface: { light: "#ffffff", dark: "#1d2939" },
    subtle: { light: palette.field, dark: "#2c3a4f" },
    accent: { light: "#b31234", dark: "#ff6b85" },
  },
  layout: {
    "font-ui": "var(--uix-font-sans)",
    "radius-inset": "var(--uix-radius-s)",
    "radius-control": "var(--uix-radius-m)",
    "radius-surface": "var(--uix-radius-m)",
    "radius-container": "var(--uix-radius-l)",
    "weight-display": "var(--uix-font-weight-bold)",
    "leading-display": "var(--uix-line-height-tight)",
    "leading-body": "var(--uix-line-height-normal)",
    "tracking-display": "var(--uix-tracking-tight)",
    "elevation-raised":
      "0 1px 3px light-dark(rgba(16, 24, 40, 0.1), rgba(0, 0, 0, 0.5))",
    "elevation-overlay":
      "0 8px 20px light-dark(rgba(16, 24, 40, 0.12), rgba(0, 0, 0, 0.45))",
    "elevation-modal":
      "0 18px 45px light-dark(rgba(16, 24, 40, 0.2), rgba(0, 0, 0, 0.6))",
  },
  logo: { width: 600, height: 291, minimumHeight: 24 },
} as const;
