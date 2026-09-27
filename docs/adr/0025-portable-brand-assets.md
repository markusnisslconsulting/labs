# Portable consulting brand assets

Status: accepted

## Context

The main site loaded Atkinson Hyperlegible and Bricolage Grotesque, while Labs
named Atkinson without supplying it and used the same face for display text.
The two applications also use different reds and surfaces. The Labs differences
support its existing text/control contrast checks and must remain deliberate.

## Decision

`packages/brand` owns a versioned, private, framework-independent artifact with
font files, logo variants, font licenses and a typed identity mapping. Its assets
are copied from a recorded main-site revision and checked by hash. No source,
build or runtime imports depend on that checkout. Upstream font licenses travel
with the artifact and the assembled workbench.

One mapping generates separate Labs semantic CSS and Tailwind theme CSS. Labs
loads the adapter at the site and Storybook entry points; generic `@labs/ui`
consumers can continue choosing their own brand/font delivery. The main site can
adopt a packed version independently. Installing it in that application remains
a separate adoption change, documented in the package README.

The Labs adapter uses existing semantic roles. It retains the current accessible
accent and surface values, supplies the actual body/interface font, and assigns
Bricolage to display text. It applies only to an unbranded root or an explicit
consulting scope. Coaching keeps its serif body/display choice. No semantic role
is added, and decorative logo red is not substituted for the action accent.
Explicit consulting sections set their own geometry and type metrics; a density
attribute on the section takes precedence over its brand default. Browser checks
compare each section under both root brands in Chromium and WebKit.

The supplied Bricolage WOFF2 files contain weight 200–800 and optical-size 12–96
axes. Their font-face declarations describe that range instead of duplicating
the same files under two fixed weights. Atkinson supplies regular, bold and
regular italic faces. Unicode subsets and fallback stacks are retained.

Foundations / Brands composes existing components into a comparison with local
form state. Its one reference story adds two projected Chromatic captures, moving
the snapshot ceiling from 144 to 146. It does not add a new component primitive.
The site logo now respects the main-site reference's 24-pixel minimum height.

The release allowlist names only the four logo files and two font licenses added
to Storybook's static output. Other files in those directories remain rejected.
Stable public logo copies remain for URL compatibility and are checked against
the package asset.

## Verification

Package tests verify asset hashes, licenses, the existing Labs palette mapping
and a real packed-artifact consumer built outside the workspace. Browser checks
load the delivered font faces, compare computed brand typography, exercise the
reference form with trusted keyboard input and check 320-pixel containment in
both themes. The package introduces no external font-service calls.

Main-site adapter adoption, additional composition patterns and manual
assistive-technology review are not established by these checks.
