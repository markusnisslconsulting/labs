# Page and demo recovery

Status: accepted

Keep the site shell outside a route boundary, and lab details outside a nested
demo boundary. A rendering failure must leave navigation and recovery actions
available. Route changes replace the route boundary; ordinary query edits retain
the mounted page and input focus.

Demo module failures have a distinct error type. Their recovery action reloads
the document, obtaining the current entry HTML and a fresh module graph. React
caches lazy-load promises and their rejections. A rendering failure instead offers
an explicit restart that remounts demo state, plus reload and catalog navigation.
Page failures offer retry, reload and a document link back to the catalog.

Recovery UI composes the shared Alert, Button, Cluster, PageHeader and Stack.
Application strings own all visible labels and explanations. Error objects and
stacks are never rendered into the page. The primary recovery action receives
focus; a successful restart focuses the named demo region or main content.

There are no automatic reloads or global error suppression. Event-handler and
asynchronous operation failures remain the owning feature's responsibility.
HTML responses must require revalidation, so an explicit reload can obtain newer
entry documents. Previous release assets remain available through ADRs 0019–0020.

Browser tests inject a failed module request, a render failure and a route failure
against the built application. They verify shell continuity, focus, recovery,
filter-preserving catalog navigation and repeated load failures without a reload
loop. Small-screen/error-state accessibility is checked separately from happy paths.

References: [React lazy loading](https://react.dev/reference/react/lazy),
[React error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary),
[Vite load-error handling](https://vite.dev/guide/build#load-error-handling).
