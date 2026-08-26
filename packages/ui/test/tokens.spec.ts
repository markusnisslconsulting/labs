import { existsSync, readFileSync, readdirSync } from "node:fs";
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

  /**
   * RTL is a whole class of bug that only appears when someone looks in
   * the right direction, so it is checked rather than reviewed. Every
   * offset that has a direction must be logical; the exceptions are
   * centring (`left: 50%` with a translate) and physical `top`/`bottom`,
   * which do not mirror.
   */
  it("no component stylesheet uses a direction-dependent physical property", () => {
    const physical =
      /(?:^|[\s;{])((?:margin|padding|border)-(?:left|right)|left|right)\s*:\s*([^;]+);/g;
    for (const { file, source } of componentCss) {
      for (const hit of strip(source).matchAll(physical)) {
        // centring an absolutely positioned surface is direction-neutral
        if (/50%/.test(hit[2]!)) continue;
        expect(
          true,
          `${file} uses ${hit[1]} — use the inline-start/inline-end form so RTL mirrors`,
        ).toBe(false);
      }
    }
  });

  /**
   * A `disabled` prop with no disabled styling is a control that lies.
   * The Switch shipped exactly that: its rule used `:disabled`, which can
   * never match the `<span role="switch">` Base UI renders, so a disabled
   * switch was indistinguishable from an enabled one.
   */
  it("disabled support and disabled styling imply each other", () => {
    const dir = "packages/ui/src/components";
    // A component reaches the disabled state either by declaring the prop
    // or by inheriting it from the native element it spreads onto. The
    // earlier version of this test only looked for the declaration, so
    // Button, IconButton, SearchInput, Select and TextField were never
    // checked at all.
    const NATIVE = [
      "ButtonHTMLAttributes",
      "InputHTMLAttributes",
      "SelectHTMLAttributes",
      "TextareaHTMLAttributes",
    ];
    for (const file of readdirSync(dir).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".stories."),
    )) {
      const name = file.replace(/\.tsx$/, "");
      const source = readFileSync(join(dir, file), "utf8");
      const canDisable =
        /^\s*disabled\?:\s*boolean/m.test(source) ||
        NATIVE.some((type) => source.includes(type));

      // Only the sheets this component actually imports. Globbing the
      // shared ones in made every component look styled, because
      // _field.css carries a rule for the fields that do import it.
      const sheets = [...source.matchAll(/import "\.\/([\w-]+\.css)"/g)]
        .map((hit) => join(dir, hit[1]!))
        .filter((path) => existsSync(path))
        .map((path) => readFileSync(path, "utf8"))
        .join("\n");
      const styled = /:disabled|\[data-disabled\]|aria-disabled/.test(sheets);

      if (canDisable) {
        expect(
          styled,
          `${name} can be disabled but no stylesheet it imports reacts to it`,
        ).toBe(true);
      }
      // The other direction, which is how the Switch bug survived: a rule
      // for a state the component cannot enter is dead CSS that reads as
      // coverage. Tabs styled .uix-tab:disabled while never passing
      // disabled to a tab.
      if (!canDisable && sheets && styled) {
        const ownSheet = existsSync(join(dir, `${name}.css`))
          ? readFileSync(join(dir, `${name}.css`), "utf8")
          : "";
        expect(
          /:disabled|\[data-disabled\]|aria-disabled/.test(ownSheet),
          `${name} styles a disabled state it cannot reach — either accept a disabled prop or drop the rule`,
        ).toBe(false);
      }
    }
  });

  /**
   * A snapshotted story that mutates in play() baselines the state AFTER
   * the interaction, under a name that promised the state before it.
   * Switch's Off story shipped an on switch that way, and NumberField's
   * ReorderPoint baselined 810 while its args said 800.
   */
  it("no snapshotted story mutates in play()", () => {
    const dir = "packages/ui/src/components";
    const ALLOWED = ["Focus", "Dialog", "Modal", "OpenState"];
    for (const file of readdirSync(dir).filter((f) =>
      f.endsWith(".stories.tsx"),
    )) {
      const source = readFileSync(join(dir, file), "utf8");
      const stories = [
        ...source.matchAll(
          /export const (\w+)[^=]*=\s*\{([\s\S]*?)(?=\nexport const |$)/g,
        ),
      ];
      for (const [, name, body] of stories) {
        if (!/disableSnapshot:\s*false/.test(body!)) continue;
        if (ALLOWED.includes(name!)) continue;
        expect(
          /userEvent\.(click|type|keyboard|tab|selectOptions)|\.click\(\)/.test(
            body!,
          ),
          `${file.replace(".stories.tsx", "")}/${name} is snapshotted and mutates in play(); split the interaction into its own story`,
        ).toBe(false);
      }
    }
  });

  /**
   * An icon is a drawing, never a character.
   *
   * Select's chevron was a ▾, NumberField's steppers were − and +, and
   * both sat wrong inside their boxes: a glyph is positioned by the
   * font's metrics, not by the box, so it cannot be centred from CSS,
   * and it changes shape with whatever font is actually available. Three
   * separate "not centred correctly" reports were all this one cause.
   *
   * The ellipsis in Pagination is deliberately not covered: it is text
   * that happens to be punctuation, not a picture of an action.
   */
  it("no component draws an icon with a text character", () => {
    const dir = "packages/ui/src/components";
    const GLYPHS = "▾▴▸◂▼▲△▽×÷−–—✓✔✕✖→←↑↓⌄⌃‹›«»•";
    const pattern = new RegExp(`>\\s*([${GLYPHS}])\\s*<`, "s");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
      const source = readFileSync(join(dir, file), "utf8");
      const hit = pattern.exec(source);
      expect(
        hit?.[1],
        `${file} renders "${hit?.[1]}" as an icon; use a lucide icon so the box positions it`,
      ).toBeUndefined();
    }
  });

  /**
   * Two promises the accessibility story rests on, both invisible until
   * a reader has changed a setting.
   *
   * Pinning font-size on the root element cancels a browser text-size
   * preference, and every length in this library is a rem against it. And
   * without color-scheme the engine keeps painting its own chrome for the
   * other theme, so a dark page gets a light scrollbar and a white date
   * picker.
   */
  it("the reader's root font size is never pinned", () => {
    for (const file of ["base.css", "reset.css"]) {
      const source = readFileSync(join("packages/ui/src/styles", file), "utf8");
      // Any font-size inside a rule that selects html or :root.
      for (const block of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = block[1]!;
        if (!/(^|[\s,])(html|:root)([\s,]|$)/.test(selector)) continue;
        expect(
          /font-size/.test(block[2]!),
          `${file} sets font-size on "${selector.trim()}"; the root size is the reader's`,
        ).toBe(false);
      }
    }
  });

  it("each theme declares its color-scheme", () => {
    const source = readFileSync(
      "packages/ui/src/styles/tokens/semantic.css",
      "utf8",
    );
    expect(
      /:root\s*\{[^}]*color-scheme:\s*light/.test(source),
      "the light theme must declare color-scheme: light",
    ).toBe(true);
    expect(
      /\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*dark/.test(source),
      "the dark theme must declare color-scheme: dark",
    ).toBe(true);
  });

  /**
   * A component may not name a shape, a face or an elevation primitive.
   *
   * The rule used to cover colour only, and the Introduction said the
   * radius and type scales "may be used directly". That single sentence
   * is why the `ocean` brand could re-point exactly one token: a brand
   * only sees the semantic layer, so anything a component reaches for
   * below it is out of the brand's reach forever. A sharp-cornered brand
   * or one with a display face was not expressible, which is most of
   * what multi-brand means.
   *
   * Font *sizes* stay allowed. The type scale is a rhythm the whole
   * library shares, and a brand that wants different sizes changes the
   * scale itself rather than each component.
   */
  it("no component names a shape, face or elevation primitive", () => {
    const FORBIDDEN = [
      /var\(--uix-radius-(s|m|l)\)/,
      /var\(--uix-shadow-\d\)/,
      /var\(--uix-font-(sans|serif|mono)\)/,
      /border-radius:\s*\d+px/,
    ];
    for (const { file, source } of componentCss) {
      for (const pattern of FORBIDDEN) {
        const hit = pattern.exec(source);
        expect(
          hit?.[0],
          `${file} uses ${hit?.[0]}; reach for a semantic role so a brand can re-point it`,
        ).toBeUndefined();
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
