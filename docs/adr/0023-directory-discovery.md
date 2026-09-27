# Directory discovery

Status: accepted

Expose Demos, Components, Patterns and Foundations as dedicated site routes.
The overview links to all four and keeps the combined lab catalog. Demo and
pattern directories select entries by manifest kind; adding a pattern uses the
same validation and lazy-loading path as a demo. Existing lab URLs remain valid.

The component directory joins `packages/ui/inventory.json` with the built
Storybook index. Each component needs one Docs destination and at least one
visible story. Prefer its Matrix as the example. Docs destinations remain valid
when Storybook omits their `dev` tag; interaction-only stories do not become
example links. Foundations and Guides are discovered from their index groups.
No second list of components or story IDs is maintained in the application.

A site-owned Vite virtual module supplies the validated directory data to browser
and server builds. It includes names, descriptions, status and public Storybook
IDs, excluding source locations and implementation metadata. The import boundary
permits this exact module only within the site package. Changes to the inventory
or built index invalidate the development module. The site build depends on the
Storybook build and catalog validation.

Directory routes participate in the same prerendering, metadata, sitemap, route
reservation and release routing contracts as lab pages. Search and status filters
use URL parameters; unknown statuses leave the directory unfiltered. Full-size
Storybook links are ordinary anchors. No embedded manager is required to discover
a component or foundation.

The first pattern is a FAQ composed from Section and Accordion. Content stays in
the feature, and Accordion owns state and keyboard behavior. The pattern does not
add a library primitive or import source from the main-site checkout. Additional
main-site compositions remain separate catalog entries as they are implemented.
