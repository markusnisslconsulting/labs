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
// Collapse whitespace, and also the space prettier inserts after "(" and
// before ")" when it wraps a long function call. light-dark() made those
// wraps common, and the registry cannot be expected to mirror them.
const norm = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ")
    .trim();

/** Declarations in a file's base `:root` only — not theme or brand overrides. */
/**
 * Drop conditional at-rule blocks, keeping their surroundings.
 *
 * `@layer tokens { … }` must survive, because everything lives inside it,
 * but a `:root` inside `@media (prefers-contrast: more)` is not the
 * default value of anything — and reading it as one made parity compare
 * the registry against the high contrast override.
 */
function withoutConditionals(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const at = source.slice(i).search(/@(media|supports|container)\b/);
    if (at === -1) return out + source.slice(i);
    out += source.slice(i, i + at);
    let j = i + at;
    while (j < source.length && source[j] !== "{") j += 1;
    let depth = 0;
    for (; j < source.length; j += 1) {
      if (source[j] === "{") depth += 1;
      else if (source[j] === "}") {
        depth -= 1;
        if (depth === 0) {
          j += 1;
          break;
        }
      }
    }
    i = j;
  }
  return out;
}

function rootDeclarations(path: string): Map<string, string> {
  const source = withoutConditionals(strip(readFileSync(path, "utf8")));
  const map = new Map<string, string>();
  // Anchored on :root, then any comma-separated companions. The previous
  // pattern required the brace to follow :root directly, so a selector
  // list did not match at all and the check below never even saw it.
  for (const block of source.matchAll(
    /(:root(?:\s*,\s*[^{,]+)*)\s*\{([^}]*)\}/g,
  )) {
    // A selector list counts when :root is one of its parts. The density
    // roles are declared on ":root, [data-density]" so that a subtree
    // carrying the attribute re-resolves them against its own multiplier,
    // and an exact-match check silently dropped all nine of them from
    // parity. A block scoped only to a theme or a brand is still skipped,
    // because those are overrides rather than the default set.
    const parts = (block[1] ?? "").split(",").map((part) => part.trim());
    if (!parts.includes(":root")) continue;
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
    // Both spellings. The components moved from ButtonHTMLAttributes to
    // ComponentPropsWithRef<"button"> so a caller could pass a ref, and
    // this list still named only the old one — so Button stopped counting
    // as a component that can be disabled and its disabled styling was
    // reported as dead.
    const NATIVE = [
      "ButtonHTMLAttributes",
      "InputHTMLAttributes",
      "SelectHTMLAttributes",
      "TextareaHTMLAttributes",
      'ComponentPropsWithRef<"button">',
      'ComponentPropsWithRef<"input">',
      'ComponentPropsWithRef<"select">',
      'ComponentPropsWithRef<"textarea">',
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
    // Two shapes, because the first version only caught a glyph alone
    // between tags and Menu shipped `{label} ▾` for months: a glyph next
    // to an expression is still a glyph.
    const pattern = new RegExp(
      `>\\s*([${GLYPHS}])\\s*<|[}\\w]\\s*([${GLYPHS}])\\s*<`,
      "s",
    );
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
      const source = readFileSync(join(dir, file), "utf8");
      const hit = pattern.exec(source);
      const glyph = hit?.[1] ?? hit?.[2];
      expect(
        glyph,
        `${file} renders "${glyph}" as an icon; use a lucide icon so the box positions it`,
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
    // color-scheme is not decoration here: every theme-dependent role is a
    // light-dark(), and light-dark() reads the used color-scheme. Losing
    // one of these does not merely change a scrollbar, it picks the wrong
    // half of twenty declarations.
    //
    // And each selector is anchored to :root, which is the other half of
    // the same fact. light-dark() inside a custom property resolves
    // against the element where the property is declared, so a nested
    // [data-theme] could only ever have flipped the native controls in
    // that subtree while every token stayed light. The anchors are what
    // stop that from looking supported.
    expect(
      /:root,\s*:root\[data-theme="light"\]\s*\{[^}]*color-scheme:\s*only light/.test(
        source,
      ),
      "the default and explicit light theme must declare color-scheme: only light",
    ).toBe(true);
    expect(
      /:root\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*only dark/.test(
        source,
      ),
      "the dark theme must declare color-scheme: only dark",
    ).toBe(true);
    expect(
      /:root\[data-theme="auto"\]\s*\{[^}]*color-scheme:\s*light dark/.test(
        source,
      ),
      "the auto theme must declare color-scheme: light dark so it follows the system",
    ).toBe(true);
  });

  /**
   * A component may not name a shape, a face or an elevation primitive.
   *
   * The rule used to cover colour only, and the Introduction said the
   * radius and type scales "may be used directly". That single sentence
   * is why the brand axis reached colour and nothing else: a brand
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
      // Typography is a brand decision too, and it was the half that
      // leaked: Panel wrote its own 0.14em tracking and eleven sheets
      // their own font-weight: 700, so a brand could change the typeface
      // and nothing about how the type was set.
      /letter-spacing:\s*[-\d.]/,
      /font-weight:\s*\d/,
      /var\(--uix-line-height-\w+\)/,
      // The primitives only. --uix-tracking-display and --uix-tracking-ui
      // are the roles, and forbidding the whole prefix banned them too.
      /var\(--uix-tracking-(tight|none|wide)\)/,
      /var\(--uix-font-weight-\w+\)/,
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

  /**
   * Component tokens are documented on the component, and the table
   * cannot drift from the registry.
   *
   * They used to live on a Foundations page, which is the wrong place
   * twice over: a reader looking at Button has to leave to find out what
   * they can override, and a page listing every component's slots is a
   * list nobody reads. The table sits in the component's own TSDoc, so
   * autodocs renders it on the component's page.
   *
   * A hand-written table is also a copy, and a copy goes stale. This
   * checks both directions: every component-tier token appears in some
   * component's table, and every default printed there is the value the
   * registry holds.
   */
  it("every component token is documented on its component, with the registry's default", () => {
    const dir = "packages/ui/src/components";
    const documented = new Map<string, { file: string; value: string }>();
    for (const file of readdirSync(dir).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".stories."),
    )) {
      const source = readFileSync(join(dir, file), "utf8");
      for (const row of source.matchAll(
        /\|\s*`(--uix-[\w-]+)`\s*\|\s*`([^`]+)`\s*\|/g,
      )) {
        documented.set(row[1]!, { file, value: row[2]!.trim() });
      }
    }

    for (const token of componentTokens) {
      const entry = documented.get(token.name);
      expect(
        entry,
        `${token.name} is in the registry but no component's Theming table lists it`,
      ).toBeDefined();
      expect(
        entry!.value,
        `${entry!.file} documents ${token.name} as "${entry!.value}", the registry says "${token.value}"`,
      ).toBe(token.value);
    }

    // The other direction, so a table cannot invent a slot.
    const known = new Set(componentTokens.map((token) => token.name));
    for (const [name, entry] of documented) {
      if (!name.startsWith("--uix-")) continue;
      if (known.has(name)) continue;
      // A table may cite a semantic or primitive token as a default's
      // origin, but not present one as this component's own slot.
      expect(
        allTokens.some((token) => token.name === name),
        `${entry.file} documents ${name}, which is in no tier of the registry`,
      ).toBe(true);
    }
  });

  /**
   * A component that needs the client needs the directive, and one that
   * does not must not have it.
   *
   * Both halves matter. Without the directive an interactive component
   * throws in a React Server Components app — not here, in the
   * consumer's build, with an error about hooks in a server component
   * and no mention of this library. With the directive where it is not
   * needed, a Badge that could have rendered on the server drags React
   * into the client bundle for nothing, which is the whole cost RSC
   * exists to avoid.
   *
   * Eleven of the thirty-four render on the server: Avatar, Badge,
   * Banner, Breadcrumb, Card, Divider, Panel, Skeleton, Spinner,
   * StatusPill, Table. Keeping that number honest is the point.
   */
  it("only the components that need the client are marked as client", () => {
    const dir = "packages/ui/src/components";
    const NEEDS = [
      // A hook is state, and state is the client.
      /\buse(State|Effect|Ref|Id|Callback|Memo|Reducer|LayoutEffect|Transition)\b/,
      // Base UI is client-only throughout.
      /@base-ui-components/,
      // A component that binds a handler itself.
      /\bon[A-Z]\w*=\{/,
      // A component that renders a control the caller will bind a handler
      // to. The caller cannot pass a function into a server component, so
      // the boundary has to be here rather than in every consumer.
      /<(button|input|select|textarea)\b/,
    ];
    for (const file of readdirSync(dir).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".stories."),
    )) {
      const raw = readFileSync(join(dir, file), "utf8");
      const marked = /^["']use client["'];/.test(raw);

      /* Comments stripped first, and this is the fourth time that has
         mattered in this repository. `EmptyState` has no state, no handler
         and no control — and its docstring shows `<Button onClick={clear}>`
         in an example, which matched the handler pattern and demanded a
         directive the component does not need. A rule that reads prose is
         a rule that changes when somebody improves the documentation. */
      const source = strip(raw).replace(/^\s*\/\/.*$/gm, "");
      const needed = NEEDS.some((pattern) => pattern.test(source));

      expect(
        marked,
        needed
          ? `${file} needs "use client" as its first line`
          : `${file} carries "use client" but renders nothing that requires it; ` +
              `it could render on the server`,
      ).toBe(needed);
    }
  });

  /**
   * Every component declares exactly one maturity status.
   *
   * The maturity models put this first: a consumer deciding whether to
   * build on a component needs to know whether its API is settled. All
   * thirty-four already carried "stable" or "beta", and nothing checked
   * it or showed it — the tag existed for a grep. It is a badge in the
   * sidebar now, which is only worth something if it is always there and
   * always exactly one.
   */
  it("every component declares one status", () => {
    const STATUSES = ["stable", "beta", "deprecated"];
    const dir = "packages/ui/src/components";
    for (const file of readdirSync(dir).filter((f) =>
      f.endsWith(".stories.tsx"),
    )) {
      const source = readFileSync(join(dir, file), "utf8");
      // Only components carry a status. A Foundations page or a Pattern
      // documents the system rather than being part of its API, so there
      // is nothing for a consumer to depend on.
      if (!/title:\s*"Components\//.test(source)) continue;
      const tags = /tags:\s*\[([^\]]*)\]/.exec(source);
      expect(tags, `${file} declares no tags`).not.toBeNull();
      const declared = [...tags![1]!.matchAll(/["'](\w+)["']/g)].map(
        (hit) => hit[1]!,
      );
      const statuses = declared.filter((tag) => STATUSES.includes(tag));
      expect(
        statuses,
        `${file} must declare exactly one of ${STATUSES.join(", ")}, found ` +
          `${statuses.length === 0 ? "none" : statuses.join(" and ")}`,
      ).toHaveLength(1);
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
    const order = entry.indexOf(
      "@layer tokens, base, components, print, overrides;",
    );
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

/**
 * Disabled is a colour, not an opacity.
 *
 * Eleven components said `opacity: var(--uix-opacity-disabled)` and
 * nothing else. Two things followed, and both were invisible to the
 * pipeline:
 *
 *   - Nothing could be measured. An opacity has no value to check against
 *     a background, so `scripts/tokens/contrast.ts` had nothing to look
 *     at, and disabled-ghost text sat near 2.6:1 while the contrast gate
 *     reported green.
 *   - The state stopped being distinct. Measured on Button: disabled and
 *     *loading* were byte for byte identical — rgb(179,18,52), white
 *     text, 0.55, in both. Busy and unavailable are two different
 *     promises to the reader.
 */
describe("disabled states", () => {
  const CSS = "packages/ui/src/components";
  const files = readdirSync(CSS).filter((f) => f.endsWith(".css"));

  /** Rules whose selector mentions a disabled state. */
  function disabledRules(source: string) {
    const out: string[] = [];
    for (const block of strip(source).matchAll(
      /([^{}]*(?::disabled|\[data-disabled\]|\[aria-disabled)[^{}]*)\{([^{}]*)\}/g,
    )) {
      out.push(block[2]!);
    }
    return out;
  }

  it.each(files)("%s expresses disabled in colour, not opacity", (file) => {
    const source = readFileSync(join(CSS, file), "utf8");
    for (const body of disabledRules(source)) {
      expect(
        body,
        `${file} dims a disabled part with opacity. Use --uix-text-disabled, ` +
          `--uix-bg-disabled or --uix-border-disabled, so the reading can be ` +
          `measured and the state stays distinct from busy.`,
      ).not.toMatch(/opacity:/);
    }
  });

  /**
   * And every component that accepts the state says something about it.
   * A component that takes `disabled` and styles nothing accepts the prop
   * and renders a control that looks available — which is how Chip
   * shipped for as long as it existed.
   */
  it("every component that takes disabled also styles it", () => {
    const missing: string[] = [];
    for (const file of readdirSync(CSS).filter((f) => f.endsWith(".tsx"))) {
      if (file.endsWith(".stories.tsx")) continue;
      const tsx = strip(readFileSync(join(CSS, file), "utf8")).replace(
        /^\s*\/\/.*$/gm,
        "",
      );
      if (!/\bdisabled\??:/.test(tsx)) continue;

      /* Every stylesheet the component actually imports, its own included.
         Delegating the disabled look to a sheet you import is legitimate
         and common: the field family gets it from `_field.css`, the choice
         controls from `_choice.css`, and `SplitButton` from `Button.css`
         because a split button that did not match the buttons beside it
         would be the defect.

         Those first two used to be named here as a hardcoded pair, which
         made the rule true for the components that existed when it was
         written and false for the next one to delegate — it failed
         `SplitButton` for doing exactly what `TextField` does. Read from
         the imports instead, so the rule describes the mechanism rather
         than a list. */
      const own = file.replace(/\.tsx$/, ".css");
      const imports = [...tsx.matchAll(/import\s+"\.\/([^"]+\.css)"/g)].map(
        (match) => match[1] as string,
      );
      const scope = [...new Set([own, ...imports])]
        .filter((name) => files.includes(name))
        .map((name) => readFileSync(join(CSS, name), "utf8"))
        .join("\n");

      if (!/:disabled|\[data-disabled\]|\[aria-disabled/.test(scope)) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });
});

/**
 * --uix-ink and --uix-paper are for shading, not for painting.
 *
 * Both flip with the theme by design: ink is the text end of the ramp,
 * paper the surface end, and a component mixes *toward* one so a hover
 * deepens on light and brightens on dark without either being written
 * twice. Naming one directly as a colour takes that flip as a promise it
 * never made.
 *
 * Three places did it, and one of them shipped a visible defect:
 *
 *   - Dialog's scrim was `color-mix(in srgb, var(--uix-ink) 45%,
 *     transparent)`. Measured in the dark theme: srgb(0.97 0.98 0.99 /
 *     0.45) — a near-white wash that lightened the page behind a modal
 *     instead of dimming it. It had never been seen, because until the
 *     backdrop got a box it painted nothing at all.
 *   - Badge and IconButton coloured text on their accent fill with
 *     --uix-paper. That renders correctly, because paper and
 *     --uix-text-on-accent happen to hold the same two values — and it
 *     would have stopped rendering correctly the moment a brand
 *     re-pointed the colour of text on its accent.
 */
describe("the neutral ramp", () => {
  const CSS = "packages/ui/src/components";

  it.each(readdirSync(CSS).filter((f) => f.endsWith(".css")))(
    "%s mixes toward ink and paper rather than naming them",
    (file) => {
      const source = strip(readFileSync(join(CSS, file), "utf8"));
      for (const declaration of source.matchAll(
        /(?:^|\n)\s*([\w-]+)\s*:\s*([^;]+);/g,
      )) {
        const [, property, value] = declaration;
        if (!/var\(--uix-(ink|paper)\b/.test(value!)) continue;
        expect(
          value!,
          `${file}: ${property} names --uix-ink or --uix-paper outside a ` +
            `color-mix(). Both flip with the theme, so the value you get is ` +
            `whichever end of the ramp the reader happens to be on. Use a ` +
            `role that says what the thing is: --uix-scrim for a modal ` +
            `wash, --uix-text-on-accent for text on an accent fill.`,
        ).toMatch(/color-mix\(/);
      }
    },
  );

  /**
   * And the scrim darkens in both themes, which is the property the role
   * exists to hold. Checked as a value rather than as a spelling: the old
   * declaration named a token and was wrong, so naming the right token is
   * not what makes it correct.
   */
  it("keeps the scrim darker than both page backgrounds", () => {
    const semantic = readFileSync(join(TOKENS, "semantic.css"), "utf8");
    const scrim = semantic.match(/--uix-scrim:\s*([\s\S]*?);/)?.[1] ?? "";
    expect(scrim, "no --uix-scrim role").not.toBe("");
    // Both arms of the light-dark() mix toward a dark end of the palette.
    for (const arm of scrim.split("),")) {
      expect(
        arm,
        `a scrim arm mixes toward ${arm.trim()}, which is not a dark value`,
      ).toMatch(/navy-900|grey-900|black/);
    }
  });
});

/**
 * A colour property may only name a token that holds a colour.
 *
 * `--uix-text-body`, `--uix-text-heading`, `--uix-text-caption` and
 * `--uix-text-ui` are **font sizes**. `--uix-text-primary`,
 * `--uix-text-secondary`, `--uix-text-disabled` and `--uix-text-on-accent`
 * are colours. Two families under one prefix, and the size family reads like
 * a colour: `color: var(--uix-text-caption)` is a sentence anyone would
 * write.
 *
 * It is also `color: 0.75rem`, which is not a colour, so CSS drops the whole
 * declaration and the element inherits. Twenty-eight of those had
 * accumulated across thirteen components, every one of them silent — no
 * warning from the browser, none from the build, and nothing to see unless
 * you happened to know what the element was supposed to look like.
 *
 * What it cost, concretely: DatePicker's out-of-month days were meant to be
 * dimmer than the month's own, and measured, both came out
 * `rgb(23, 43, 77)`. A calendar of August showed the last five days of July
 * in the same ink as August. That was found by taking a screenshot of a
 * component nobody had looked at, then measuring because the screenshot was
 * ambiguous.
 *
 * The registry knows every token's type, so the check is exact rather than a
 * name heuristic.
 */
describe("colour properties name colour tokens", () => {
  const COLOUR_PROPERTIES = new Set([
    "color",
    "background",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-block-start-color",
    "border-block-end-color",
    "border-inline-start-color",
    "border-inline-end-color",
    "outline-color",
    "fill",
    "stroke",
    "caret-color",
    "text-decoration-color",
    "accent-color",
  ]);

  /* Types that legitimately appear in a colour property. `elevation` is a
     box-shadow, `opacity` shows up inside colour functions. */
  const COLOUR_LIKE = new Set(["color", "elevation", "opacity"]);

  const typeOf = new Map(allTokens.map((token) => [token.name, token.type]));

  it("never sets a colour from a size, a duration or a z-index", () => {
    const wrong: string[] = [];
    for (const { file, source } of componentCss) {
      /* Comments first. This docstring names the exact pattern it forbids,
         and a check that read its own prose has been the bug five times in
         this repository. */
      const lines = strip(source).split("\n");
      lines.forEach((line, index) => {
        const declaration = /^\s*([\w-]+)\s*:\s*(.+);\s*$/.exec(line);
        if (!declaration) return;
        if (!COLOUR_PROPERTIES.has(declaration[1]!)) return;
        for (const [, name] of declaration[2]!.matchAll(
          /var\((--uix-[\w-]+)/g,
        )) {
          const kind = typeOf.get(name!);
          if (kind && !COLOUR_LIKE.has(kind)) {
            wrong.push(
              `${file}:${index + 1} ${declaration[1]}: var(${name}) is a ` +
                `"${kind}" token, so this declaration is dropped`,
            );
          }
        }
      });
    }
    expect(wrong).toEqual([]);
  });
});

/**
 * `AvatarGroup`'s idea of how big a face is matches `Avatar`'s.
 *
 * Everything geometric in `AvatarGroup.css` used to be a fraction of
 * `--uix-control-sm`, `-md` or `-lg`. Those are control *heights* — what a
 * button is tall — and an avatar's diameter is set in `Avatar.css` as a plain
 * `width`. They agree at `md` by coincidence, both 2.5rem, and disagree at
 * the other two: 2rem against 1.6rem at `sm`, 3rem against 3.5rem at `lg`.
 *
 * So the overlap was a fifth of the wrong quantity, and the "+2" counter was
 * a circle of the wrong size — 32px beside 25.6px faces at `sm`, 48px beside
 * 56px at `lg`. Neither was in a story, so nothing had ever drawn it.
 *
 * The numbers are duplicated because a component stylesheet here may not
 * import another's. This is the check that keeps the duplicate honest; it is
 * the whole reason duplicating was acceptable.
 */
describe("avatar sizes agree across the two components", () => {
  const read = (file: string) =>
    componentCss.find((entry) => entry.file === file)?.source ?? "";

  it("has a face diameter per size, matching Avatar's own", () => {
    const avatar = strip(read("Avatar.css"));
    const group = strip(read("AvatarGroup.css"));
    expect(avatar, "Avatar.css not found").not.toBe("");
    expect(group, "AvatarGroup.css not found").not.toBe("");

    /* Avatar's diameters, from the rule that sets them. */
    const diameters = new Map<string, string>();
    for (const [, size, width] of avatar.matchAll(
      /\.uix-avatar\[data-size="(\w+)"\][^{]*\{[^}]*?width:\s*([^;]+);/g,
    )) {
      diameters.set(size!, width!.trim());
    }
    expect(
      [...diameters.keys()].sort(),
      "Avatar.css no longer sets a width per size, so this check has stopped " +
        "checking",
    ).toEqual(["lg", "md", "sm"]);

    /* The group's map. `sm` is the unqualified value, the same way the
       component's own rules are ordered. */
    const faces = new Map<string, string>();
    const base =
      /\.uix-avatargroup\s*\{[^}]*?--uix-avatargroup-face:\s*([^;]+);/.exec(
        group,
      );
    if (base) faces.set("sm", base[1]!.trim());
    for (const [, size, value] of group.matchAll(
      /\.uix-avatargroup\[data-size="(\w+)"\]\s*\{[^}]*?--uix-avatargroup-face:\s*([^;]+);/g,
    )) {
      faces.set(size!, value!.trim());
    }

    const wrong: string[] = [];
    for (const [size, width] of diameters) {
      const face = faces.get(size);
      if (face !== width) {
        wrong.push(
          `${size}: Avatar is ${width}, AvatarGroup thinks ${face ?? "nothing"}`,
        );
      }
    }
    expect(
      wrong,
      "the two components disagree about how wide an avatar is, so the " +
        "overlap is a fraction of the wrong number and the counter is the " +
        "wrong size",
    ).toEqual([]);
  });

  it("no longer takes its geometry from a control height", () => {
    /* The other direction: the fix is only in force while nothing here goes
       back to the token that caused it. A control height is a legitimate
       thing for this file to mention — it just cannot be what a face is
       measured by. */
    const group = strip(read("AvatarGroup.css"));
    const offenders = [
      ...group.matchAll(
        /(margin-inline-start|inline-size|block-size):\s*[^;]*--uix-control-(sm|md|lg)/g,
      ),
    ].map((hit) => hit[0]);
    expect(
      offenders,
      "an avatar's geometry is being taken from a control height again",
    ).toEqual([]);
  });
});

/**
 * The composition rules, as checks rather than as documentation.
 *
 * A design system's components carry the rules that make assembly safe.
 * Written down they hold until somebody is in a hurry; written as a check
 * they hold. These three are the ones that decide whether a page built out
 * of these parts by somebody — or something — with no view of the whole
 * still holds together.
 *
 * Each was written after the rule it encodes had already been broken in this
 * repository, which is the only reason to believe it is worth having.
 */
describe("the composition rules", () => {
  /** A component's root rule: `.uix-<name>` with nothing else in the selector. */
  const rootRules = () =>
    componentCss.flatMap(({ file, source }) => {
      const name = file.replace(/\.css$/, "").toLowerCase();
      const css = strip(source);
      const pattern = new RegExp(
        `(?:^|\\}|\\{)\\s*\\.uix-${name}\\s*\\{([^}]*)\\}`,
        "gmi",
      );
      return [...css.matchAll(pattern)].map((hit) => ({
        file,
        body: hit[1]!,
      }));
    });

  const declarations = (body: string, property: RegExp) =>
    [...body.matchAll(property)].map((hit) => ({
      property: hit[1]!,
      value: hit[2]!.trim(),
    }));

  it("no component claims space outside itself", () => {
    /**
     * `Panel` had `margin: 0 0 var(--uix-gap-xl)`. It looked right on the
     * page it was designed for, and it is a decision that depends on what
     * the component sits next to — which the component cannot know. Two of
     * them side by side collapse, or do not, depending on which properties
     * each chose, and a conditional sibling breaks it outright.
     *
     * Found by `Stack`'s first test on its first run. Space is the
     * container's, so it belongs to `Stack`, `Cluster` and `Columns`.
     *
     * Zero is allowed, because resetting an inherited margin is not
     * claiming space. `auto` is allowed, because that is centring, which is
     * what `Container` does and the one legitimate outer margin here.
     */
    /* The lookbehind is not decoration. Without it the width rule below
       matched the tail of `border-inline-start-width`, and reported Banner's
       4px severity bar as a component fixing its own width. A property name
       is only that property when nothing word-like precedes it. */
    const MARGIN =
      /(?<![-\w])(margin(?:-block|-inline)?(?:-start|-end|-top|-bottom|-left|-right)?)\s*:\s*([^;]+);/g;
    const offenders: string[] = [];
    for (const { file, body } of rootRules()) {
      for (const { property, value } of declarations(body, MARGIN)) {
        const parts = value.split(/\s+/).filter(Boolean);
        const inert = parts.every((part) =>
          ["0", "0px", "0rem", "0em", "auto"].includes(part),
        );
        if (!inert) offenders.push(`${file}: ${property}: ${value}`);
      }
    }
    expect(
      offenders,
      "a component's root is setting an outer margin. Space between things " +
        "belongs to the container that holds them — wrap the callers in a " +
        "Stack and take it off here.",
    ).toEqual([]);
  });

  /**
   * Components whose width is not a layout claim, with the reason.
   *
   * The rule is that a component composed into a column may not decide how
   * wide that column is. Two kinds of component are not in a column at all:
   * an overlay in the top layer, whose width is its own and which already
   * clamps itself to the viewport, and a control whose size is intrinsic to
   * the thing being drawn.
   */
  const FIXED_WIDTH_OK: Record<string, string> = {
    "Dialog.css":
      "an overlay in the top layer, not in any column. Already clamped to " +
      "the viewport, which is the responsive behaviour a caller wants and " +
      "cannot supply from outside.",
    "Popover.css": "an overlay, same as Dialog",
    "Toaster.css": "an overlay, same as Dialog",
    "Switch.css":
      "the track is the control, and its width is a drawing dimension in " +
      "the same sense as a checkbox's. It scales with the control tokens " +
      "rather than with the column it sits in.",
  };

  it("has no width exemption for a component that no longer needs one", () => {
    /* The other direction, so the list above cannot outlive its reasons —
       the same shape as the keyboard map's stale-exemption check. */
    const WIDTH = /(?<![-\w])(inline-size|width)\s*:\s*([^;]+);/g;
    const fixes = new Set<string>();
    for (const { file, body } of rootRules()) {
      for (const { value } of declarations(body, WIDTH)) {
        const ok =
          /^(100%|auto|inherit|fit-content|max-content|min-content|stretch)$/.test(
            value,
          ) || value.startsWith("var(");
        if (!ok) fixes.add(file);
      }
    }
    const stale = Object.keys(FIXED_WIDTH_OK).filter(
      (file) => !fixes.has(file),
    );
    expect(stale, "these are exempted and no longer fix a width").toEqual([]);
  });

  it("no component fixes its own width", () => {
    /**
     * A component with a fixed `inline-size` cannot be put in a narrower
     * column, and the failure is silent: it overflows, or it forces its
     * parent wider, and either way the page it was assembled into is wrong
     * rather than the component. `max-inline-size` is fine — that is a
     * ceiling, not a demand — and so is `100%`.
     */
    const WIDTH = /(?<![-\w])(inline-size|width)\s*:\s*([^;]+);/g;
    const offenders: string[] = [];
    for (const { file, body } of rootRules()) {
      for (const { property, value } of declarations(body, WIDTH)) {
        const ok =
          /^(100%|auto|inherit|fit-content|max-content|min-content|stretch)$/.test(
            value,
          ) || value.startsWith("var(");
        if (!ok && !FIXED_WIDTH_OK[file]) {
          offenders.push(`${file}: ${property}: ${value}`);
        }
      }
    }
    expect(
      offenders,
      "a component's root is fixing its own width, so it cannot be composed " +
        "into a narrower column. Use a maximum, let the container decide, or " +
        "add it to FIXED_WIDTH_OK with the reason it is not in a column.",
    ).toEqual([]);
  });

  it("no component hard-codes a heading level", () => {
    /**
     * A heading's level is a property of where the component sits, which is
     * the one thing it cannot see. `src/heading.tsx` supplies it from
     * position instead. A literal `<h2>` in a component is a page outline
     * decided by whoever wrote the component rather than by the page.
     *
     * Story files are exempt: a story is a page, and a page may write its
     * own headings.
     */
    const offenders: string[] = [];
    for (const file of readdirSync(COMPONENTS)) {
      if (!file.endsWith(".tsx") || file.includes(".stories.")) continue;
      const source = strip(readFileSync(join(COMPONENTS, file), "utf8"));
      for (const hit of source.matchAll(/<(h[1-6])[\s>]/g)) {
        offenders.push(`${file}: <${hit[1]}>`);
      }
    }
    expect(
      offenders,
      "a component contains a literal heading element. Use `Heading` from " +
        "src/heading.tsx, which takes its level from position.",
    ).toEqual([]);
  });
});
