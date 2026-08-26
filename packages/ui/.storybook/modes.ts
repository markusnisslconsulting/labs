/**
 * Chromatic modes, named and shared.
 *
 * Each export is a COMPLETE mode set, not an extra. Chromatic replaces
 * the global modes when a story defines its own, so `modes: { ...NARROW }`
 * built from a single entry would quietly drop dark coverage from that
 * story. Every set therefore includes light and dark and adds to them.
 *
 * Modes multiply the bill, so they stay opt-in per story: a component
 * needs the narrow mode only if its layout can reflow, and the RTL mode
 * only if it has a direction-dependent axis — an arrow, an offset, a
 * thumb that travels. Applying either to a Badge pays twice for one
 * picture.
 */
const BASE = {
  light: { theme: "light" },
  dark: { theme: "dark" },
} as const;

/** Adds a 390px width. For anything that reflows. */
export const NARROW = {
  ...BASE,
  narrow: { theme: "light", viewport: "narrow" },
} as const;

/** Adds right-to-left. For anything with a direction-dependent axis. */
export const RTL = {
  ...BASE,
  rtl: { theme: "light", direction: "rtl" },
} as const;

export const NARROW_AND_RTL = {
  ...BASE,
  narrow: { theme: "light", viewport: "narrow" },
  rtl: { theme: "light", direction: "rtl" },
} as const;
