# Assembled release preview

Status: accepted

Build the site and Storybook through their owning projects, then assemble one
public artifact. `tooling/release` owns assembly, file integrity and the HTTP
preview. `tests/release` owns cross-surface browser checks. Application metadata
supplies the document routes; the release tools do not import application source.

Use explicit catalog routes instead of a blanket SPA fallback. Unknown documents
return a 404 page and missing assets remain failures. Generate Apache routing
rules from the same routes and verify them separately from the Node preview.
Keep build metadata outside public content and record every public file hash.

Development mounts the built Storybook at the same `/storybook/` path. Site
journeys run against the assembled artifact so a successful outer page cannot
hide an absent workbench.

This decision establishes a local artifact and verification boundary. Remote
staging, retained assets, promotion and rollback depend on verified host
capabilities and are not selected by this ADR.
