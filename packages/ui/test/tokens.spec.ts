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

function parseCss(path: string): Map<string, string> {
  const source = readFileSync(path, "utf8");
  const map = new Map<string, string>();
  for (const [, name, value] of source.matchAll(
    /(--uix-[\w-]+):\s*([^;]+);/g,
  )) {
    map.set(name.trim(), value.trim());
  }
  return map;
}

describe("token registry parity", () => {
  const css = new Map(cssFiles.flatMap((path) => [...parseCss(path)]));

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
      expect(css.get(token.name), token.name).toBe(token.value);
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

  it("semantic and component tokens reference primitives or semantics — never raw hex", () => {
    const aliasable = new Set(
      [...primitiveTokens, ...semanticTokens].map((token) => token.name),
    );
    for (const token of [...semanticTokens, ...componentTokens]) {
      if (token.type !== "color") continue;
      const isVar = token.value.startsWith("var(");
      const isRgba = token.value.startsWith("rgba(");
      // rgba washes are allowed at the semantic layer only.
      if (isRgba) {
        expect(token.level).toBe("semantic");
        continue;
      }
      expect(isVar, `${token.name}: ${token.value}`).toBe(true);
      const reference = token.value.match(/var\((--uix-[\w-]+)\)/)?.[1];
      if (reference && token.level === "semantic") {
        expect(
          aliasable.has(reference),
          `${token.name} must alias a primitive or semantic token`,
        ).toBe(true);
      }
    }
  });
});
