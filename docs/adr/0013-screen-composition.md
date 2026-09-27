# Screen composition and preview boundaries

Status: accepted

Screens assemble shared components and named patterns. A pattern combines components for a reusable task or content arrangement; a screen supplies its data, state and route behavior.

Use the layout primitives (`AppShell`, `Container`, `Stack`, `Cluster`, `Columns`, `Split` and `Section`) for their existing responsibilities. Keep feature state and application-specific copy in the application. Extract repeated arrangements within their owning feature; move a pattern into the shared library when it has a reusable contract and consumers. Storybook examples can share fictional compositions under `packages/ui/src/examples` without making them package exports.

Full-page stories use the fullscreen layout. Their docs previews run in bounded iframes so viewport units and page landmarks belong to the example. Ordinary component stories retain space for focus rings. Components respond to their available container width, including when that width is smaller than the browser window.

Verify responsive layouts in the browser. A page must not scroll horizontally; an intentionally scrollable table or code sample owns its own scroll area. Check that content remains visible and non-overlapping, since hiding overflow alone does not prove a layout works.
