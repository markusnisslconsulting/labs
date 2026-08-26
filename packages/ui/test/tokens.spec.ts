import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  allTokens,
  componentTokens,
  primitiveTokens,
  semanticTokens,
} from "../src/tokens.registry";

const TOKENS = "packages/ui/src/styles/tokens";
const COMPONENTS = "packages/ui/src/components";
const BRANDS = "packages/ui/src/styles/brands";

const componentCss = readdirSync(COMPONENTS)
  .filter((file) => file.endsWith(".css"))
  .map((file) => ({
    file,
    source: readFileSync(join(COMPONENTS, file), "utf8"),
  }));

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const norm = (value: string) => value.replace(/\s+/g, " ").trim();

/** Declarations in a file's base `:root` only — not theme or brand overrides. */
function rootDeclarations(path: string): Map<string, string> {
  const source = strip(readFileSync(path, "utf8"));
  const map = new Map<string, string>();
  for (const block of source.matchAll(
    /(:root|\[[^\]]+\][^{]*)\s*\{([^}]*)\}/g,
  )) {
    if (block[1]?.trim() !== ":root") continue;
    for (const decl of (block[2] ?? "").matchAll(
      /(--uix-[\w-]+):\s*([^;]+);/g,
    )) {
      map.set(decl[1]!, norm(decl[2]!));
    }
  }
  return map;
}

/** Every `var(--name, default)` override slot used by the component CSS. */
function overrideSlots(): Map<string, string> {
  const slots = new Map<string, string>();
  for (const { source } of componentCss) {
    // scan the stripped text throughout: matching one string and indexing
    // into another shifts every offset by the length of the comments.
    const css = strip(source);
    for (const hit of css.matchAll(/var\(\s*(--uix-[\w-]+)\s*,/g)) {
      const name = hit[1]!;
      let index = hit.index! + hit[0].length;
      let depth = 1;
      let value = "";
      while (index < css.length && depth > 0) {
        const char = css[index]!;
        if (char === "(") depth += 1;
        else if (char === ")") {
          depth -= 1;
          if (depth === 0) break;
        }
        value += char;
        index += 1;
      }
      if (!slots.has(name)) slots.set(name, norm(value));
    }
  }
  return slots;
}

const primitiveCss = rootDeclarations(join(TOKENS, "primitive.css"));
const semanticCss = rootDeclarations(join(TOKENS, "semantic.css"));
const slots = overrideSlots();

describe("token registry parity", () => {
  it("primitive and semantic tiers match the CSS exactly", () => {
    for (const [tokens, css, tier] of [
      [primitiveTokens, primitiveCss, "primitive"],
      [semanticTokens, semanticCss, "semantic"],
    ] as const) {
      const declared = new Set(tokens.map((token) => token.name));
      for (const name of css.keys()) {
        expect(
          declared.has(name),
          `${name} is in the ${tier} CSS but not the registry`,
        ).toBe(true);
      }
      for (const token of tokens) {
        expect(
          css.has(token.name),
          `${token.name} is in the registry but not the ${tier} CSS`,
        ).toBe(true);
        expect(css.get(token.name), token.name).toBe(norm(token.value));
      }
    }
  });

  it("token names are unique across every tier", () => {
    const names = allTokens.map((token) => token.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("component tokens are override slots", () => {
  /**
   * The component tier is deliberately not declared in CSS. Each token is
   * referenced as var(--name, <semantic default>), so the slot costs no
   * bytes until a brand fills it. These tests keep the registry honest
   * about slots that exist only as fallbacks.
   */
  it("no component token is declared in the shipped token files", () => {
    for (const token of componentTokens) {
      expect(
        primitiveCss.has(token.name),
        `${token.name} must not be declared`,
      ).toBe(false);
      expect(
        semanticCss.has(token.name),
        `${token.name} must not be declared`,
      ).toBe(false);
    }
  });

  it("every registered slot is actually used, with the registered default", () => {
    for (const token of componentTokens) {
      expect(
        slots.has(token.name),
        `${token.name} is registered but no component CSS offers it as a slot`,
      ).toBe(true);
      expect(slots.get(token.name), token.name).toBe(norm(token.value));
    }
  });

  it("every slot the CSS offers is registered", () => {
    const registered = new Set(componentTokens.map((token) => token.name));
    const upper = new Set([
      ...primitiveTokens.map((token) => token.name),
      ...semanticTokens.map((token) => token.name),
    ]);
    for (const name of slots.keys()) {
      if (upper.has(name)) continue; // a semantic token used with a fallback
      expect(
        registered.has(name),
        `${name} is offered by the CSS but missing from the registry`,
      ).toBe(true);
    }
  });
});

describe("the layering rules the architecture depends on", () => {
  const colourPrimitives = new Set(
    primitiveTokens
      .filter((token) => token.type === "color")
      .map((token) => token.name),
  );

  /**
   * The invariant that actually matters, checked where it is actually
   * broken: in the consuming stylesheets, not in the registry's own
   * declared aliases. Colour is what themes and brands remap, so a
   * component naming a colour primitive escapes both. Spacing, radius
   * and type primitives are a shared scale and may be used directly.
   */
  it("no component stylesheet names a colour primitive", () => {
    for (const { file, source } of componentCss) {
      for (const hit of strip(source).matchAll(/var\(\s*(--uix-[\w-]+)/g)) {
        expect(
          colourPrimitives.has(hit[1]!),
          `${file} uses the colour primitive ${hit[1]} — bind to a semantic token instead`,
        ).toBe(false);
      }
    }
  });

  /**
   * A literal colour is the other way round the layering: `background:
   * #fff` never reaches a theme or a brand, and the var()-based check
   * above cannot see it because there is no var() to inspect. The Switch
   * knob shipped as #fff for exactly this reason.
   */
  it("no component stylesheet hardcodes a colour", () => {
    const literal = /(?:^|[\s:(,])(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/;
    for (const { file, source } of componentCss) {
      for (const [index, line] of strip(source).split("\n").entries()) {
        // A colour inside color-mix()/oklch() built FROM a token is fine;
        // a bare literal is not.
        if (/var\(--uix-/.test(line)) continue;
        expect(
          literal.test(line),
          `${file}:${index + 1} hardcodes a colour — bind to a token instead: ${line.trim()}`,
        ).toBe(false);
      }
    }
  });

  it("every component stylesheet lives in @layer components", () => {
    for (const { file, source } of componentCss) {
      expect(
        source.includes("@layer components"),
        `${file} must be wrapped in @layer components`,
      ).toBe(true);
    }
  });

  it("the entry declares the layer order before importing anything", () => {
    const entry = readFileSync("packages/ui/src/styles.css", "utf8");
    const order = entry.indexOf("@layer tokens, base, components, overrides;");
    expect(order, "styles.css must declare the layer order").toBeGreaterThan(
      -1,
    );
    expect(order, "the layer order must precede the imports").toBeLessThan(
      entry.indexOf("@import"),
    );
  });

  /**
   * A brand is usually scoped to a subtree while the theme sits on the
   * root. A single compound selector demands both attributes on one
   * element, so a nested brand silently keeps its light values under a
   * dark root. Every brand must therefore ship the descendant spelling
   * too.
   */
  it("a brand's theme overrides compose when the brand is nested", () => {
    for (const file of readdirSync(BRANDS).filter((name) =>
      name.endsWith(".css"),
    )) {
      const source = strip(readFileSync(join(BRANDS, file), "utf8"));
      const brand = file.replace(/\.css$/, "");
      const compound = source.includes(
        `[data-brand="${brand}"][data-theme="dark"]`,
      );
      if (!compound) continue;
      expect(
        source.includes(`[data-theme="dark"] [data-brand="${brand}"]`),
        `${file} overrides the dark theme only as a compound selector, so a ` +
          `brand nested under a dark root keeps its light values`,
      ).toBe(true);
    }
  });

  it("a brand only re-points semantic tokens", () => {
    const semanticNames = new Set(semanticTokens.map((token) => token.name));
    for (const file of readdirSync(BRANDS).filter((name) =>
      name.endsWith(".css"),
    )) {
      const source = strip(readFileSync(join(BRANDS, file), "utf8"));
      const declared = [...source.matchAll(/(--uix-[\w-]+):/g)].map(
        (hit) => hit[1]!,
      );
      expect(declared.length, `${file} declares nothing`).toBeGreaterThan(0);
      for (const name of declared) {
        expect(
          semanticNames.has(name),
          `${file} sets ${name}; a brand may only re-point semantic tokens`,
        ).toBe(true);
      }
    }
  });
});
