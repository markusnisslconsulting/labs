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
    const parts = rgb[1]!
      .split(/[,/\s]+/)
      .filter(Boolean)
      .map(Number);
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

/**
 * Declarations from the blocks whose selector and at-rule context pass.
 *
 * This walked the file with `/([^{}]+)\{([^{}]*)\}/g` and took the
 * innermost block's selector. Inside
 *
 *     @media (prefers-contrast: more) {
 *       :root { --uix-text-disabled: ...; }
 *     }
 *
 * the innermost block's selector is `:root`, so the high-contrast
 * overrides were collected as base values — and being later in the file,
 * they *overwrote* the base ones. Every reading in the report was the
 * high-contrast palette. The default palette, the one almost everybody
 * sees, had never been measured.
 *
 * That is visible in the old output once you know: body text and
 * secondary text scored identically on every background, because the
 * override sets `--uix-text-secondary: var(--uix-text-primary)`. Two
 * different colours, one number, for as long as this script has existed.
 *
 * The file's own comment above pickScheme describes the same class of bug
 * being fixed once for `[data-theme="dark"]`. A selector-matching parser
 * with no notion of nesting will keep producing it, so this one tracks
 * depth and the enclosing at-rules instead.
 */
function collect(
  css: string,
  accept: (selector: string) => boolean,
  /** Which conditional at-rules must be in force. Order-independent. */
  conditions: string[] = [],
): Scope {
  const out: Scope = new Map();
  const source = strip(css);
  const stack: string[] = [];
  let i = 0;
  let prelude = "";

  while (i < source.length) {
    const ch = source[i]!;
    if (ch === "{") {
      const head = prelude.trim();
      prelude = "";
      if (head.startsWith("@")) {
        stack.push(head);
        i += 1;
        continue;
      }
      // A rule block. Its body runs to the matching brace; nested rules
      // are not legal CSS inside one, so a scan to the next brace is safe.
      const close = source.indexOf("}", i);
      const body = source.slice(i + 1, close === -1 ? undefined : close);
      // Every condition asked for is present, and no other conditional
      // at-rule is: a block guarded by @media (forced-colors) is not the
      // base palette either.
      const conditional = stack.filter(
        (rule) => rule.startsWith("@media") || rule.startsWith("@supports"),
      );
      const matches =
        conditional.length === conditions.length &&
        conditions.every((want) =>
          conditional.some((rule) => rule.includes(want)),
        );
      if (matches && accept(head)) {
        for (const decl of body.matchAll(/(--uix-[\w-]+)\s*:\s*([^;]+);/g)) {
          out.set(decl[1]!, decl[2]!.replace(/\s+/g, " ").trim());
        }
      }
      i = close === -1 ? source.length : close + 1;
      continue;
    }
    if (ch === "}") {
      stack.pop();
      prelude = "";
      i += 1;
      continue;
    }
    prelude += ch;
    i += 1;
  }
  return out;
}

/**
 * Replace every light-dark(a, b) with the half this theme uses.
 *
 * The dark theme used to be a second block of declarations under
 * [data-theme="dark"], and this script picked it up by selector. Now each
 * theme-dependent role is one light-dark() declaration read by the used
 * color-scheme, which a stylesheet parser has no notion of — so the theme
 * is applied here, where the scope is built and the theme is known.
 * Without this the check silently measured light values against dark
 * backgrounds and reported eight failures that were its own.
 */
function pickScheme(value: string, theme: "light" | "dark"): string {
  let out = "";
  let rest = value;
  for (;;) {
    const at = rest.search(/light-dark\(/i);
    if (at === -1) return out + rest;
    out += rest.slice(0, at);
    // Walk to the matching bracket rather than trusting a regex: the
    // branches are var() and rgba() calls with commas of their own.
    let depth = 0;
    let end = -1;
    const open = at + rest.slice(at).indexOf("(");
    for (let i = open; i < rest.length; i += 1) {
      if (rest[i] === "(") depth += 1;
      else if (rest[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) return out + rest;
    const parts = splitTop(rest.slice(open + 1, end));
    const chosen = theme === "dark" ? parts[1] : parts[0];
    out += pickScheme((chosen ?? "").trim(), theme);
    rest = rest.slice(end + 1);
  }
}

/**
 * The palette in force for one (theme, brand, contrast) combination.
 *
 * `contrast: "more"` layers the `prefers-contrast: more` overrides on top
 * of the base, which is what the cascade does. It is measured as its own
 * combination rather than folded in, because it is a different palette
 * that a real user setting selects — and because it used to be the *only*
 * palette this script measured, by accident. Dropping it now would trade
 * one blind spot for another.
 */
function scopeFor(
  theme: "light" | "dark",
  brand: string,
  contrast: "normal" | "more" = "normal",
): Scope {
  const scope: Scope = new Map();
  const add = (from: Scope) =>
    from.forEach((value, name) => scope.set(name, pickScheme(value, theme)));

  const primitive = readFileSync(join(TOKENS, "primitive.css"), "utf8");
  const semantic = readFileSync(join(TOKENS, "semantic.css"), "utf8");

  add(collect(primitive, (s) => s === ":root"));
  add(collect(semantic, (s) => s === ":root"));
  if (brand !== "default") {
    const file = join(BRANDS, `${brand}.css`);
    if (existsSync(file)) {
      const css = readFileSync(file, "utf8");
      add(collect(css, (s) => s === `[data-brand="${brand}"]`));
      // A brand no longer needs a theme selector: its theme-dependent
      // values are light-dark() and pickScheme has already chosen.
    }
  }
  if (contrast === "more") {
    add(collect(semantic, (s) => s === ":root", ["prefers-contrast: more"]));
  }
  return scope;
}

/** Resolve a token to an rgb value, following var() and color-mix(). */
function resolve(
  name: string,
  scope: Scope,
  seen = new Set<string>(),
): Rgb | null {
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
    const a = evaluate(
      (first ? first[1]! : parts[0]!).trim(),
      scope,
      new Set(seen),
    );
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
  {
    what: "body text on the page",
    fg: "--uix-text-primary",
    bg: "--uix-bg-page",
    target: 4.5,
  },
  {
    what: "body text on a surface",
    fg: "--uix-text-primary",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "body text on a subtle fill",
    fg: "--uix-text-primary",
    bg: "--uix-bg-subtle",
    target: 4.5,
  },
  {
    what: "secondary text on the page",
    fg: "--uix-text-secondary",
    bg: "--uix-bg-page",
    target: 4.5,
  },
  {
    what: "secondary text on a surface",
    fg: "--uix-text-secondary",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "secondary text on a subtle fill",
    fg: "--uix-text-secondary",
    bg: "--uix-bg-subtle",
    target: 4.5,
  },
  // WCAG exempts an inactive control, and axe honours that for a native
  // disabled element. It cannot honour it for label and value text beside
  // a control, so disabled text keeps the full 4.5 target.
  {
    what: "disabled text on the page",
    fg: "--uix-text-disabled",
    bg: "--uix-bg-page",
    target: 4.5,
  },
  {
    what: "disabled text on a surface",
    fg: "--uix-text-disabled",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "disabled text on a subtle fill",
    fg: "--uix-text-disabled",
    bg: "--uix-bg-subtle",
    target: 4.5,
  },
  /* The pairing that could not exist while disabled was an opacity.
     Eleven components dimmed themselves by 45% and there was nothing here
     to check, because an opacity has no colour to measure. Now the fill is
     a role, the text on it is a role, and this is the reading that decides
     whether a locked field is still legible — which is usually the reason
     it was locked. */
  {
    what: "disabled text on a disabled fill",
    fg: "--uix-text-disabled",
    bg: "--uix-bg-disabled",
    target: 4.5,
  },
  /* No pairing for the edge of a disabled control, and the reason is not
     that it looks fine.
     WCAG 1.4.11 exempts inactive user interface components from the 3:1
     non-text requirement, so there is no number to hold the edge to. The
     first draft of this file asserted 3:1 anyway and both readings failed
     at 1.32 and 1.39 — an invented threshold, failed honestly. Inventing
     a lower one to make it pass would be worse.
     What is measured instead is the part that is *not* exempt: the text
     on a disabled control, above. A reader finds a locked field by its
     label, and the label has to be legible — usually the label is why it
     was locked. Whether the control still reads as a control is a
     judgment, and `nx run ui:visual-sweep` is where that judgment gets
     made, by looking.
     One consequence worth writing down: --uix-bg-disabled resolves to the
     same value as --uix-bg-subtle, and that is forced rather than lazy.
     Every darker candidate on this neutral ramp drops
     --uix-text-disabled below 4.5 on it — measured, grey-300 gives 4.04
     on light and slate-600 gives 2.87 on dark. So a disabled control
     sitting on a subtle surface loses its fill and keeps its text, which
     is the trade the ramp allows. */
  {
    what: "label on an accent fill",
    fg: "--uix-text-on-accent",
    bg: "--uix-accent",
    target: 4.5,
  },
  {
    what: "label on an inverted surface",
    fg: "--uix-text-on-inverse",
    bg: "--uix-surface-inverse",
    target: 4.5,
  },
  {
    what: "positive status on a surface",
    fg: "--uix-status-ok",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "caution status on a surface",
    fg: "--uix-status-warn",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "danger status on a surface",
    fg: "--uix-status-danger",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "neutral status on a surface",
    fg: "--uix-status-off",
    bg: "--uix-bg-surface",
    target: 4.5,
  },
  {
    what: "info text on its container",
    fg: "--uix-text-primary",
    bg: "--uix-container-info",
    target: 4.5,
  },
  {
    what: "text on the success container",
    fg: "--uix-text-primary",
    bg: "--uix-container-success",
    target: 4.5,
  },
  {
    what: "text on the warning container",
    fg: "--uix-text-primary",
    bg: "--uix-container-warning",
    target: 4.5,
  },
  {
    what: "text on the danger container",
    fg: "--uix-text-primary",
    bg: "--uix-container-danger",
    target: 4.5,
  },
  // An inverted surface has to be visible against what it sits on, not
  // merely legible inside itself. Checking only the label on it missed a
  // dark-mode chip that read perfectly and disappeared into the page.
  {
    what: "inverted surface against the page",
    fg: "--uix-surface-inverse",
    bg: "--uix-bg-page",
    target: 3,
  },
  {
    what: "inverted surface against a surface",
    fg: "--uix-surface-inverse",
    bg: "--uix-bg-surface",
    target: 3,
  },
  // Non-text contrast: a focus ring nobody can see is not a focus ring.
  {
    what: "focus ring against the page",
    fg: "--uix-focus-ring",
    bg: "--uix-bg-page",
    target: 3,
  },
  {
    what: "focus ring against a surface",
    fg: "--uix-focus-ring",
    bg: "--uix-bg-surface",
    target: 3,
  },
  {
    what: "accent fill against the page",
    fg: "--uix-accent",
    bg: "--uix-bg-page",
    target: 3,
  },
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
  contrast: "normal" | "more";
}

const CONTRASTS = ["normal", "more"] as const;

function measure(): Result[] {
  const out: Result[] = [];
  for (const brand of brands()) {
    for (const theme of THEMES) {
      for (const contrast of CONTRASTS) {
        const scope = scopeFor(theme, brand, contrast);
        for (const pairing of PAIRINGS) {
          const fg = resolve(pairing.fg, scope);
          const bg = resolve(pairing.bg, scope);
          out.push({
            ...pairing,
            theme,
            brand,
            contrast,
            value: fg && bg ? ratio(fg, bg) : null,
          });
        }
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
    const group = `${r.brand} / ${r.theme} / contrast ${r.contrast}`;
    if (group !== currentGroup) {
      currentGroup = group;
      console.log(`\n${group}`);
    }
    const value = r.value === null ? "  n/a" : r.value.toFixed(2).padStart(5);
    const mark = r.value === null ? "?" : r.value < r.target ? "FAIL" : "ok";
    console.log(
      `  ${value}:1  (needs ${r.target})  ${mark.padEnd(4)} ${r.what}`,
    );
  }
  console.log(
    `\n${results.length} pairings across ${brands().length} brand(s) x ${THEMES.length} themes x ${CONTRASTS.length} contrast settings` +
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
      `${brands().length} brand(s), ${THEMES.length} themes and ` +
      `${CONTRASTS.length} contrast settings.`,
  );
  process.exit(0);
}

console.error(`unknown mode: ${mode} (expected report | check)`);
process.exit(2);
