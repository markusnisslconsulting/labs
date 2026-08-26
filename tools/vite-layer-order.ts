import type { Plugin } from "vite";

/**
 * Put the cascade layer order first in every emitted stylesheet.
 *
 * The order of `@layer` is fixed by where each name is FIRST seen, and a
 * bare `@layer a, b, c;` only wins if nothing has already opened one of
 * those layers. In a bundle it has not: component CSS arrives through JS
 * module imports and is emitted before the entry stylesheet's `@import`s,
 * so the built file opened with `@layer components{` and the declaration
 * two kilobytes later was too late to matter.
 *
 * The consequence was silent and total. With `components` registered
 * first it ranked BELOW `base`, so `button { color: inherit }` in the
 * base layer beat every component's colour and, for example, an active
 * chip rendered navy text on a navy fill.
 *
 * lightningcss made it worse by rewriting the declaration down to the one
 * layer it could not find a block for, which is why the app also builds
 * with esbuild's CSS minifier.
 *
 * This prepends the declaration to each CSS asset and then asserts the
 * result, because a guarantee that is not checked is a comment.
 */
const ORDER = "@layer tokens, base, components, print, overrides;";

export function layerOrder(): Plugin {
  return {
    name: "labs-layer-order",
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== "asset" || !asset.fileName.endsWith(".css"))
          continue;
        const css = String(asset.source);
        // Drop any copy the entry contributed, wherever it landed.
        const withoutDeclaration = css.replace(
          /@layer\s+[a-z, ]+;\s*/g,
          (match) => (/\{/.test(match) ? match : ""),
        );
        const next = `${ORDER}\n${withoutDeclaration}`;

        const firstBlock = next.search(/@layer\s+[a-z]+\s*\{/);
        const declaration = next.indexOf(ORDER);
        if (firstBlock !== -1 && declaration > firstBlock) {
          this.error(
            `${asset.fileName}: the layer order must precede every @layer block, ` +
              `otherwise the first block decides precedence`,
          );
        }
        asset.source = next;
      }
    },
  };
}
