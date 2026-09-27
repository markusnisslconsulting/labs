# Generated workbench reference data

Status: accepted

## Context

The Introduction duplicated component counts, package sizes, stylesheet layers
and Storybook destinations. Those descriptions drifted from the inventory and
build, including a link to a foundation page that did not exist.

## Decision

The Storybook Vite configuration provides a build-time `virtual:labs-facts`
module. It validates the inventory, compares its component names with the built
package, and reads the actual stylesheet layer order. Storybook build, development
and story-test targets depend on the UI package build.

The size commands and documentation share one package-file measurement helper.
It follows static relative JavaScript imports/re-exports and CSS imports, counts
each file once per entry, and sums the independently gzipped files. External
packages and dynamic imports are outside that measurement. JavaScript imports
are parsed as syntax so examples inside strings and comments do not add files.
Missing relative imports fail instead of being counted as zero bytes.

The public facts include a UTC measurement date and scope. They are not final
application bundle costs; the isolated consumer builds retain that separate
check. The virtual module emits only the facts, without filesystem paths or
build-tool implementation.

Reference navigation reads the running workbench's `index.json`, chooses Docs
or a visible example, and uses Storybook's MDX link handling to navigate the
manager. This avoids a second list of generated IDs and a build dependency on
the index that Storybook itself is producing. A failed request leaves the
instructions readable and directs the reader to the sidebar.

Guidance describes current behavior and the limits of automated checks.
Historical rationale remains in ADRs. Audit and keyboard tables compose Stack
and Table; long inline code wraps in Docs prose, while table and block-code
overflow stays inside its container.

## Verification

Unit fixtures cover shared imports, missing files, false import text, inventory
mismatches, layer order and the public virtual-module boundary. Assembled-release
browser checks compare the displayed facts with the package, follow every
generated reference through the manager, inject an index-request failure, and
check narrow Docs containment and keyboard access to wide tables.

The broader native-browser, manual accessibility and public-content reviews
remain separate work; these checks do not establish them.
