/**
 * Contrast gate across every theme and brand.
 *
 * The audit recommended this and then did not build it, which left the
 * most expensive kind of gap: a rule everyone agrees with and nothing
 * checks. Colour pairings are exactly where multi-brand systems fail
 * quietly, because a brand supplies one hex value and nobody re-derives
 * what it now sits on in dark mode.
 *
 * What it does: resolves the token graph per (theme, brand) combination —
 * following var() chains and evaluating the color-mix() the semantic
 * layer uses for washes and container tints — then measures the WCAG 2.1
 * contrast ratio of every declared pairing and fails below its target.
 *
 * Targets follow WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text and
 * for the non-text contrast of focus rings and control boundaries.
 *
 * Usage: tsx scripts/tokens/contrast.ts [report|check]
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const TOKENS = "packages/ui/src/styles/tokens";
const BRANDS = "packages/ui/src/styles/brands";

/* ------------------------------------------------------------ colour maths */

type Rgb = { r: number; g: number; b: number };

function parseColour(value: string): Rgb | null {
  const hex = value.trim().match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1]!;
    if (h.length === 3 || h.length === 4) {
      h = h
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1]!.split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length >= 3) return { r: parts[0]!, g: parts[1]!, b: parts[2]! };
  }
  return null;
}

/** sRGB relative luminance, per WCAG 2.1. */
function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

function mix(a: Rgb, b: Rgb, weightA: number): Rgb {
  const w = Math.max(0, Math.min(1, weightA));
  return {
    r: Math.round(a.r * w + b.r * (1 - w)),
    g: Math.round(a.g * w + b.g * (1 - w)),
    b: Math.round(a.b * w + b.b * (1 - w)),
  };
}

/* --------------------------------------------------------- token resolution */

type Scope = Map<string, string>;

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Declarations from the blocks whose selector passes `accept`. */
function collect(css: string, accept: (selector: string) => boolean): Scope {
  const out: Scope = new Map();
  for (const block of strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1]!.trim();
    if (!accept(selector)) continue;
    for (const decl of block[2]!.matchAll(/(--uix-[\w-]+)\s*:\s*([^;]+);/g)) {
      out.set(decl[1]!, decl[2]!.replace(/\s+/g, " ").trim());
    }
  }
  return out;
}

function scopeFor(theme: "light" | "dark", brand: string): Scope {
  const scope: Scope = new Map();
  const add = (from: Scope) => from.forEach((v, k) => scope.set(k, v));

  const primitive = readFileSync(join(TOKENS, "primitive.css"), "utf8");
  const semantic = readFileSync(join(TOKENS, "semantic.css"), "utf8");

  add(collect(primitive, (s) => s === ":root"));
  add(collect(semantic, (s) => s === ":root"));
  if (theme === "dark") {
    add(collect(semantic, (s) => s.includes('[data-theme="dark"]')));
  }
  if (brand !== "default") {
    const file = join(BRANDS, `${brand}.css`);
    if (existsSync(file)) {
      const css = readFileSync(file, "utf8");
      add(collect(css, (s) => s === `[data-brand="${brand}"]`));
      if (theme === "dark") {
        add(
          collect(css, (s) =>
            s.includes(`[data-brand="${brand}"][data-theme="dark"]`),
          ),
        );
      }
    }
  }
  return scope;
}

/** Resolve a token to an rgb value, following var() and color-mix(). */
function resolve(name: string, scope: Scope, seen = new Set<string>()): Rgb | null {
  if (seen.has(name)) return null;
  seen.add(name);
  const raw = scope.get(name);
  if (!raw) return null;
  return evaluate(raw, scope, seen);
}

function evaluate(value: string, scope: Scope, seen: Set<string>): Rgb | null {
  const direct = parseColour(value);
  if (direct) return direct;

  const varOnly = value.match(/^var\(\s*(--uix-[\w-]+)\s*(?:,([\s\S]*))?\)$/);
  if (varOnly) {
    const hit = resolve(varOnly[1]!, scope, seen);
    if (hit) return hit;
    if (varOnly[2]) return evaluate(varOnly[2].trim(), scope, new Set(seen));
    return null;
  }

  // color-mix(in srgb, <colour> <pct>, <colour>)
  const cm = value.match(/^color-mix\(\s*in\s+[\w-]+\s*,([\s\S]+)\)$/i);
  if (cm) {
    const parts = splitTop(cm[1]!);
    if (parts.length !== 2) return null;
    const first = parts[0]!.trim().match(/^([\s\S]+?)\s+(\d+(?:\.\d+)?)%$/);
    const a = evaluate((first ? first[1]! : parts[0]!).trim(), scope, new Set(seen));
    const weight = first ? Number(first[2]) / 100 : 0.5;
    const secondRaw = parts[1]!.trim().replace(/\s+\d+(\.\d+)?%$/, "");
    // `transparent` over an unknown ground cannot be measured; the caller
    // pairs washes against the surface they sit on instead.
    if (/^transparent$/i.test(secondRaw)) return a;
    const b = evaluate(secondRaw, scope, new Set(seen));
    return a && b ? mix(a, b, weight) : null;
  }
  return null;
}

/** Split on top-level commas only. */
function splitTop(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

/* ------------------------------------------------------------- the pairings */

interface Pairing {
  what: string;
  fg: string;
  bg: string;
  /** 4.5 for body text, 3 for large text and non-text contrast. */
  target: number;
}

const PAIRINGS: Pairing[] = [
  { what: "body text on the page", fg: "--uix-text-primary", bg: "--uix-bg-page", target: 4.5 },
  { what: "body text on a surface", fg: "--uix-text-primary", bg: "--uix-bg-surface", target: 4.5 },
  { what: "body text on a subtle fill", fg: "--uix-text-primary", bg: "--uix-bg-subtle", target: 4.5 },
  { what: "secondary text on the page", fg: "--uix-text-secondary", bg: "--uix-bg-page", target: 4.5 },
  { what: "secondary text on a surface", fg: "--uix-text-secondary", bg: "--uix-bg-surface", target: 4.5 },
  { what: "secondary text on a subtle fill", fg: "--uix-text-secondary", bg: "--uix-bg-subtle", target: 4.5 },
  { what: "label on an accent fill", fg: "--uix-text-on-accent", bg: "--uix-accent", target: 4.5 },
  { what: "label on an inverted surface", fg: "--uix-text-on-inverse", bg: "--uix-surface-inverse", target: 4.5 },
  { what: "positive status on a surface", fg: "--uix-status-ok", bg: "--uix-bg-surface", target: 4.5 },
  { what: "caution status on a surface", fg: "--uix-status-warn", bg: "--uix-bg-surface", target: 4.5 },
  { what: "danger status on a surface", fg: "--uix-status-danger", bg: "--uix-bg-surface", target: 4.5 },
  { what: "neutral status on a surface", fg: "--uix-status-off", bg: "--uix-bg-surface", target: 4.5 },
  { what: "info text on its container", fg: "--uix-text-primary", bg: "--uix-container-info", target: 4.5 },
  { what: "text on the success container", fg: "--uix-text-primary", bg: "--uix-container-success", target: 4.5 },
  { what: "text on the warning container", fg: "--uix-text-primary", bg: "--uix-container-warning", target: 4.5 },
  { what: "text on the danger container", fg: "--uix-text-primary", bg: "--uix-container-danger", target: 4.5 },
  // An inverted surface has to be visible against what it sits on, not
  // merely legible inside itself. Checking only the label on it missed a
  // dark-mode chip that read perfectly and disappeared into the page.
  { what: "inverted surface against the page", fg: "--uix-surface-inverse", bg: "--uix-bg-page", target: 3 },
  { what: "inverted surface against a surface", fg: "--uix-surface-inverse", bg: "--uix-bg-surface", target: 3 },
  // Non-text contrast: a focus ring nobody can see is not a focus ring.
  { what: "focus ring against the page", fg: "--uix-focus-ring", bg: "--uix-bg-page", target: 3 },
  { what: "focus ring against a surface", fg: "--uix-focus-ring", bg: "--uix-bg-surface", target: 3 },
  { what: "accent fill against the page", fg: "--uix-accent", bg: "--uix-bg-page", target: 3 },
];

const THEMES = ["light", "dark"] as const;

function brands(): string[] {
  const found = existsSync(BRANDS)
    ? readdirSync(BRANDS)
        .filter((f) => f.endsWith(".css"))
        .map((f) => f.replace(/\.css$/, ""))
    : [];
  return ["default", ...found];
}

interface Result extends Pairing {
  theme: string;
  brand: string;
  value: number | null;
}

function measure(): Result[] {
  const out: Result[] = [];
  for (const brand of brands()) {
    for (const theme of THEMES) {
      const scope = scopeFor(theme, brand);
      for (const pairing of PAIRINGS) {
        const fg = resolve(pairing.fg, scope);
        const bg = resolve(pairing.bg, scope);
        out.push({
          ...pairing,
          theme,
          brand,
          value: fg && bg ? ratio(fg, bg) : null,
        });
      }
    }
  }
  return out;
}

const results = measure();
const mode = process.argv[2] ?? "report";
const failures = results.filter((r) => r.value !== null && r.value < r.target);
const unmeasured = results.filter((r) => r.value === null);

if (mode === "report") {
  let currentGroup = "";
  for (const r of results) {
    const group = `${r.brand} / ${r.theme}`;
    if (group !== currentGroup) {
      currentGroup = group;
      console.log(`\n${group}`);
    }
    const value = r.value === null ? "  n/a" : r.value.toFixed(2).padStart(5);
    const mark =
      r.value === null ? "?" : r.value < r.target ? "FAIL" : "ok";
    console.log(`  ${value}:1  (needs ${r.target})  ${mark.padEnd(4)} ${r.what}`);
  }
  console.log(
    `\n${results.length} pairings across ${brands().length} brand(s) x ${THEMES.length} themes` +
      `  |  ${failures.length} below target  |  ${unmeasured.length} unmeasurable`,
  );
  process.exit(0);
}

if (mode === "check") {
  if (unmeasured.length) {
    console.error("Contrast check could not resolve some pairings:\n");
    for (const r of unmeasured) {
      console.error(`  - ${r.brand}/${r.theme}: ${r.fg} on ${r.bg}`);
    }
    process.exit(1);
  }
  if (failures.length) {
    console.error("Contrast check failed\n");
    for (const r of failures) {
      console.error(
        `  - ${r.brand}/${r.theme}: ${r.what} is ${r.value!.toFixed(2)}:1, ` +
          `needs ${r.target}:1  (${r.fg} on ${r.bg})`,
      );
    }
    console.error(
      "\nA brand may pick a hue; it may not pick a pairing that cannot be read.",
    );
    process.exit(1);
  }
  console.log(
    `Contrast check passed — ${results.length} pairings across ` +
      `${brands().length} brand(s) and ${THEMES.length} themes.`,
  );
  process.exit(0);
}

console.error(`unknown mode: ${mode} (expected report | check)`);
process.exit(2);
