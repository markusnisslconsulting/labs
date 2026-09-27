# Consulting brand assets

`@labs/brand` is the versioned identity source for Labs and a portable asset
package for the main site. It contains local font files, logo variants, colour
mapping and consumer-specific styles. It has no React or Tailwind runtime
dependency. `src/index.ts` owns the mapping; `brand:generate` updates its CSS
adapters and `brand:build` rejects drift.

## Labs

Import the UI styles, then the consulting adapter once at the application entry:

```ts
import "@labs/ui/styles.css";
import "@labs/brand/labs.css";
```

The adapter uses existing semantic roles. It applies to an unbranded root and
explicit `data-brand="consulting"` scopes. Coaching retains its serif body and
display roles. Import `fonts.css` alone when the application supplies its own
mapping. Font faces are loaded from the bundled assets, with `font-display: swap`;
there is no font-service request at runtime.

The interface role keeps the UI library's existing Atkinson/system fallback
stack in both brands; only the body and display stacks are remapped. Explicit
consulting scopes also set their corners, type metrics, elevation and default
density, so nesting one inside coaching does not inherit the coaching geometry.
A `data-density` attribute on that scope overrides its default density.

Atkinson provides regular/bold and regular italic in Latin and Latin Extended.
The Bricolage files have weight 200–800 and optical-size 12–96 axes, with Latin,
Latin Extended and Vietnamese subsets. The CSS advertises that weight range.
Other characters use the declared fallback stack; no broader language coverage
is claimed.

## Main-site adoption

Build with `pnpm nx run brand:build`, then pack the `packages/brand/dist`
directory. Install that versioned local tarball in the consuming repository.
No build or runtime imports may point to a sibling checkout.

For Tailwind 4, replace the duplicated identity declarations in the main site's
`@theme` block with:

```css
@import "tailwindcss";
@import "@labs/brand/tailwind.css";
```

Remove its separate font-face import after adopting this adapter. Business
content, layout, type scale, analytics and integrations remain application-owned.
The main-site checkout has not been migrated by this package change.

## Colour mapping

The main site uses decorative red `#e5173f`, text red `#c41235`, dark-background
red `#ff6b83` and paper `#f5f6f8`. Labs retains its tested accent pair
`#b31234` / `#ff6b85` and page pair `#f7f9fc` / `#101828`. Its surface and subtle
roles also retain their existing light/dark values. The shared navy is `#172b4d`.

Decorative red is not assigned to a Labs text/button role. There is no new
semantic token: the mapping targets existing roles and is checked against the
library's accessible palette. Brand artwork may use identity colours; ordinary
text, controls and focus indicators use the UI roles.

## Logo

Preserve the supplied 600:291 aspect ratio, leave clear space, and use at least
24 CSS pixels of height in digital layouts. The main-site brand reference defines
clear space by the height of one peak. Use navy on light surfaces, white on dark
surfaces, and red as artwork where suitable. Do not stretch, rotate or add shadows.
Give a standalone image a meaningful name; use empty alt text when adjacent text
already names the same link. A monochrome mask may follow the text role for theme
and forced-colour compatibility.

The stable `logo.webp` files in the site and Storybook public folders are
compatibility copies. A test verifies them against this package's navy asset.

## Provenance and licenses

`provenance.json` records the source revision and asset hashes. Font bytes are
unchanged from the main site's local assets. The copied CSS was consolidated to
declare Bricolage's actual variable-weight range.

- [Atkinson Hyperlegible](https://github.com/googlefonts/atkinson-hyperlegible)
  — copyright Braille Institute of America; included OFL 1.1 license.
- [Bricolage Grotesque](https://github.com/ateliertriay/bricolage)
  — copyright Bricolage Grotesque Project Authors; included OFL 1.1 license.

Distribute the files under `licenses/` with the fonts. Labs includes them in the
public workbench at `font-licenses/`, linked from Foundations / Brands. The MN
logos are Markus Nissl's identity assets; inclusion does not grant a general
right to use the mark for another identity.
