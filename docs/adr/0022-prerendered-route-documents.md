# Prerendered route documents

Status: accepted

Build the site browser bundle and a private server renderer, then render the
catalog, lab descriptions and missing-page view through the same application
components. The renderer runs only during the build. Its output stays under
`apps/site/.out/prerender`; only the browser build and generated HTML enter the
public artifact. Hosting continues to require static files and FTPS only.

The catalog supplies public routes, titles, descriptions, canonical URLs and the
sitemap. One metadata contract serves initial HTML and client navigation. Missing
pages have their own initial content, a noindex directive, no canonical URL and
HTTP 404 status. The existing logo and favicon provide identity assets; the brand
mapping and licensed font work remain separate.

Hydration first matches the static document, then applies query/history state and
loads browser-only demo modules. This prevents filtered URLs and return links from
invalidating the server-rendered tree. Catalog filters are disabled before
hydration. Descriptions, requirements, resource links and catalog navigation remain
available without JavaScript, with an explanation of which controls require it.

Assembly qualifies each document's asset URLs into its release namespace. Apache
routes each catalog slug to `releases/<id>/pages/<slug>.html`; its rules are the last
entry replaced by the existing journaled FTPS transaction. Index/404 documents,
robots and sitemap retain stable public URLs. Old route documents and their assets
remain available with the rest of a retained release. The Node preview uses the
same route-to-document mapping. Promotion remains a sequence of verified writes,
not an atomic site-wide switch.

Only declared catalog routes may contribute prerendered documents. Archive
extraction accepts bounded document paths into its temporary directory and checks
them against the validated manifest before accepting the artifact. A missing
generated page or an undeclared page rejects assembly/extraction without replacing
the previous output.

Verify initial content with JavaScript disabled, then verify hydration, metadata
updates, query/history restoration, interactive actions, real 404 responses and
release promotion/rollback in the browser. Run the route checks against local
Apache as well as the Node preview.

References: [Vite server rendering](https://vite.dev/guide/ssr),
[React hydration](https://react.dev/reference/react-dom/client/hydrateRoot),
[server snapshots](https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering).
