import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  allTokens,
  componentTokens,
  primitiveTokens,
  semanticTokens,
} from "../src/tokens.registry";

const cssFiles = [
  "packages/ui/src/styles/tokens/primitive.css",
  "packages/ui/src/styles/tokens/semantic.css",
  "packages/ui/src/styles/tokens/component.css",
];

/** Theme- und Density-Blöcke überschreiben bewusst dieselben Namen;
    die Registry dokumentiert die light-Werte. */
function stripOverrides(source: string): string {
  return source
    .replace(/\[data-(theme|density|brand)="[^"]*"\]\s*\{[^}]*\}/g, "")
    .replace(/\/\* Dark:[^]*?(?=\*\/\n\/\* Component|\*\/\n:root)/s, "");
}

function parseCss(path: string): Map<string, string> {
  const source = stripOverrides(readFileSync(path, "utf8"));
  const map = new Map<string, string>();
  for (const [, name, value] of source.matchAll(
    /(--uix-[\w-]+):\s*([^;]+);/g,
  )) {
    // Mehrlinige Werte (calc, font stacks) whitespace-frei vergleichen.
    map.set(name.trim(), value.trim().replace(/\s+/g, ""));
  }
  return map;
}

const css = new Map(
  cssFiles.flatMap((path) => [...parseCss(path)]),
);

const norm = (value: string) => value.replace(/\s+/g, "");

describe("token registry parity", () => {
  it("registry and CSS define the exact same set of tokens", () => {
    const registryNames = new Set(allTokens.map((token) => token.name));
    expect(registryNames.size).toBe(allTokens.length);

    for (const [name] of css) {
      expect(
        registryNames.has(name),
        `${name} exists in CSS but not in tokens.registry.ts`,
      ).toBe(true);
    }
    for (const token of allTokens) {
      expect(
        css.has(token.name),
        `${token.name} exists in the registry but not in CSS`,
      ).toBe(true);
    }
  });

  it("registry values match the CSS values", () => {
    for (const token of allTokens) {
      expect(css.get(token.name), token.name).toBe(norm(token.value));
    }
  });

  it("each tier file holds exactly its own tier", () => {
    const byFile = [
      ["packages/ui/src/styles/tokens/primitive.css", primitiveTokens],
      ["packages/ui/src/styles/tokens/semantic.css", semanticTokens],
      ["packages/ui/src/styles/tokens/component.css", componentTokens],
    ] as const;
    for (const [path, tokens] of byFile) {
      const file = parseCss(path);
      for (const token of tokens) {
        expect(file.has(token.name), `${token.name} in wrong tier file`).toBe(
          true,
        );
      }
      expect(file.size).toBe(tokens.length);
    }
  });

  it("semantic tokens alias primitives or siblings; components alias the upper tiers", () => {
    const primitiveNames = new Set(primitiveTokens.map((token) => token.name));
    const semanticNames = new Set(semanticTokens.map((token) => token.name));
    const upperNames = new Set([...primitiveNames, ...semanticNames]);

    for (const token of semanticTokens) {
      if (token.type !== "color") continue;
      if (token.value.startsWith("rgba(")) continue; // Washes erlaubt
      if (token.name === "--uix-focus-ring") continue; // folgt dem Accent (semantisch bewusst)
      if (token.name.startsWith("--uix-container-")) continue; // Container-Tints mischen semantische Tokens bewusst
      const references = [
        ...token.value.matchAll(/var\((--uix-[\w-]+)\)/g),
      ].map((m) => m[1]);
      expect(references.length, `${token.name} must alias`).toBeGreaterThan(0);
      for (const reference of references) {
        expect(
          primitiveNames.has(reference),
          `${token.name} must alias a primitive`,
        ).toBe(true);
      }
    }

    for (const token of componentTokens) {
      const references = [
        ...token.value.matchAll(/var\((--uix-[\w-]+)\)/g),
      ].map((m) => m[1]);
      expect(references.length, `${token.name} must alias`).toBeGreaterThan(0);
      for (const reference of references) {
        expect(
          upperNames.has(reference),
          `${token.name} must alias a primitive or semantic token`,
        ).toBe(true);
      }
    }
  });
});
