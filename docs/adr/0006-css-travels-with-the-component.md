# 0006 — CSS travels with the component, order via @layer

Status: accepted (2026-08)

## Context

A single `styles.css` with every component meant a page showing one badge
downloaded 30.4 kB of CSS for 33 components. But splitting it means the
insertion order of the stylesheets follows load order rather than authoring
order — and then the network decides the cascade.

## Decision

Every component imports its own stylesheet. `styles.css` is only the floor:
token layers, brands, element defaults.

The order is declared once:

```css
@layer tokens, base, components, overrides;
```

Every component stylesheet lives in `@layer components`. A chunk arriving
late over the network therefore still lands in the right place, and can beat
neither the tokens nor a product's `overrides`.

Consumption goes through subpath exports (`@labs/ui/components/Button`). The
barrel stays for prototypes, but pulls in every stylesheet, because a CSS
import is a side effect and cannot be optimised away.

## Consequences

- First load of the labs site: 30.4 kB → 11.3 kB.
- The library build needs a plugin: library mode extracts the CSS per entry
  but removes the `import "./X.css"` from the JS. Without the plugin,
  consumers would have to import stylesheets by hand — exactly the coupling
  the split is meant to remove.
- `@layer` is mandatory, not cosmetic. Without the declaration the fault
  would be intermittent and reproducible only on a cold cache.

## Addendum (2026-08): the declaration alone is not enough

The `@layer` declaration was in `styles.css` and still did not apply in the
bundle. The order of layers is fixed the moment a name first appears — and
in the bundle `components` appears first, because component CSS arrives
through JS imports and lands before the entry file's `@import`s. The
declaration sat two kilobytes later and was therefore inert.

The consequence was silent and total: `components` ranked **below** `base`,
so `button { color: inherit }` beat every component colour. It became
visible in one place, on an active chip with navy text on a navy surface.

Two corrections:

- `tools/vite-layer-order.ts` puts the declaration at the start of every
  emitted stylesheet and checks the result afterwards.
- lightningcss collapsed `@layer a, b, c;` onto the one layer it could find
  a block for. The app therefore minifies CSS with esbuild.

The lesson: a guarantee that is not checked in the artefact is not a
guarantee. The test checked the source file; the bundle was what was broken.
